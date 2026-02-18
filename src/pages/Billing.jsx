import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import DataTable from '../components/DataTable';
import { Calendar, Download, DollarSign, FileText, Printer, X, CheckCircle, FileDown, FileCheck } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from '../components/pdf/InvoicePDF';
import { generateBillingExcel } from '../lib/excel';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from '../components/InvoiceTemplate';
import styles from './Billing.module.css';
import { cn } from '../lib/utils';

const Billing = () => {
    const { requests, researchers, services, invoices, createInvoice } = useAppContext();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const invoiceRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => invoiceRef.current,
        documentTitle: `Factura_${selectedInvoice?.invoiceNumber || 'Borrador'}`,
    });

    const billingData = useMemo(() => {
        if (!startDate || !endDate) return [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return requests.filter(req => {
            const reqDate = new Date(req.entryDate || req.createdAt);
            const statusReady = req.status === 'processed' || req.status === 'completed';
            return statusReady && reqDate >= start && reqDate <= end;
        });
    }, [requests, startDate, endDate]);

    const groupedData = useMemo(() => {
        const groups = {};
        billingData.forEach(req => {
            const researcher = researchers.find(r => r.id === req.researcherId);
            if (!researcher) return;
            if (!groups[researcher.id]) {
                groups[researcher.id] = { researcher, items: [], total: 0 };
            }
            const service = services.find(s => s.id === req.serviceId);
            let cost = 0;
            if (service) {
                const tariff = researcher.tariff || 'C';
                const price = service[`price${tariff}`] || 0;
                const quantity = req.finalSamplesCount || req.samplesCount || 1;
                cost = price * quantity;
            }
            const quantity = req.finalSamplesCount || req.samplesCount || 1;
            groups[researcher.id].items.push({ ...req, serviceName: service?.name, cost, quantity });
            groups[researcher.id].total += cost;
        });
        return Object.values(groups);
    }, [billingData, researchers, services]);

    const handleGenerateInvoice = async (group) => {
        if (!confirm(`¿Generar factura para ${group.researcher.fullName} por importe de ${(group.total * 1.21).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}?`)) return;
        try {
            const invoiceData = {
                researcherId: group.researcher.id,
                amount: group.total * 1.21,
                requestIds: group.items.map(i => i.id)
            };
            const newInvoice = await createInvoice(invoiceData);
            await generateBillingExcel([group], { start: startDate, end: endDate, invoiceNumber: newInvoice.invoiceNumber });
            alert(`Factura ${newInvoice.invoiceNumber} generada correctamente.`);
        } catch (error) {
            console.error("Error generating invoice:", error);
            alert("Error al generar la factura.");
        }
    };

    const openPrintPreview = (invoice) => {
        if (invoice.researcher) {
            const invoiceNumber = `BORRADOR`;
            setSelectedInvoice({ ...invoice, invoiceNumber, date: new Date().toLocaleDateString('es-ES') });
            return;
        }
        setSelectedInvoice({
            invoiceNumber: invoice.invoiceNumber,
            date: new Date(invoice.createdAt).toLocaleDateString('es-ES'),
            researcher: researchers.find(r => r.id === invoice.researcherId),
            items: [],
            total: invoice.amount / 1.21
        });
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const response = await fetch(`/api/invoices/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ payment_status: newStatus })
            });

            if (response.ok) {
                // Update local state to reflect change immediately without refetch
                const updatedInvoices = invoices.map(inv =>
                    inv.id === id ? { ...inv, payment_status: newStatus } : inv
                );
                // Ideally we should update the context, but for MVP we might need to force a reload or use a setter from context if available.
                // Assuming AppContext has setInvoices or we trigger a refetch. 
                // Since createInvoice is from context, maybe there is a refresh method? 
                // For now, let's reload the page to see changes or just let the user know.
                // actually, invoices comes from context. We should probably add a refresh method to context.
                // But for now, let's just alert.
                window.location.reload(); // Simple refresh to get new state
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error al actualizar estado");
        }
    };

    const markAsDispatched = async (invoice) => {
        if (!confirm(`¿Marcar factura ${invoice.invoiceNumber} como tramitada a Gestión Económica?`)) return;

        try {
            console.log("Attempting to dispatch invoice:", invoice.id);
            const url = `/api/invoices/${invoice.id}/email`;
            console.log("Dispatching to URL:", url);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    email: 'gestion.economica@ucm.es', // Dummy email or system identifier
                    subject: 'Tramitado a Gestión Económica'
                })
            });

            if (response.ok) {
                alert("Factura marcada como tramitada correctamente");
            } else {
                const errorText = await response.text();
                console.error("Dispatch failed:", response.status, errorText);
                alert(`Error al tramitar la factura: ${response.status} ${errorText}`);
            }
        } catch (error) {
            console.error("Error dispatching invoice (network/code):", error);
            alert(`Error de conexión al tramitar: ${error.message}`);
        }
    };

    // Enrich invoices with researcher name
    const enrichedInvoices = useMemo(() => {
        return invoices.map(inv => {
            const researcher = researchers.find(r => r.id === inv.researcherId);
            return {
                ...inv,
                researcherName: researcher?.fullName || 'Sin asignar',
                formattedDate: new Date(inv.createdAt).toLocaleDateString('es-ES')
            };
        });
    }, [invoices, researchers]);

    // Define columns for invoice history DataTable
    const columns = useMemo(() => [
        {
            accessorKey: 'invoiceNumber',
            header: 'Nº Factura',
            cell: ({ getValue }) => (
                <span className="font-mono font-semibold text-indigo-600">
                    {getValue()}
                </span>
            ),
        },
        {
            accessorKey: 'formattedDate',
            header: 'Fecha',
            cell: ({ getValue }) => (
                <span className="text-slate-700">{getValue()}</span>
            ),
        },
        {
            accessorKey: 'researcherName',
            header: 'Investigador',
            cell: ({ getValue }) => (
                <span className="text-slate-800">{getValue()}</span>
            ),
        },
        {
            accessorKey: 'amount',
            header: 'Importe',
            cell: ({ getValue }) => {
                const val = getValue();
                const amount = val !== undefined && val !== null ? val : 0;
                return (
                    <span className="font-bold text-green-600">
                        {amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                );
            },
        },
        {
            accessorKey: 'payment_status',
            header: 'Estado Pago',
            cell: ({ getValue, row, table }) => {
                const status = getValue() || 'Pending';
                const color = status === 'Paid' ? 'text-green-600 bg-green-100' : status === 'Overdue' ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100';

                return (
                    <select
                        value={status}
                        onChange={(e) => table.options.meta?.updateStatus(row.original.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${color}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="Pending">Pendiente</option>
                        <option value="Paid">Pagado</option>
                        <option value="Overdue">Vencido</option>
                    </select>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row, table }) => {
                const invoice = row.original;
                return (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => table.options.meta?.markAsDispatched(invoice)}
                            className="btn-icon-sm text-indigo-600 hover:text-indigo-800"
                            title="Tramitar a Gestión Económica"
                        >
                            <FileCheck size={16} />
                        </button>
                        <button
                            onClick={() => openPrintPreview(invoice)}
                            className="btn-icon-sm text-blue-600 hover:text-blue-800"
                            title="Vista previa / Imprimir"
                        >
                            <Printer size={16} />
                        </button>
                    </div>
                );
            },
        },
    ], [openPrintPreview]);

    return (
        <div className="space-y-6 fade-in">
            <header className={styles.header}>
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Facturación</h1>
                    <p className={styles.subtitle}>Generación de facturas por periodo</p>
                </div>
            </header>

            <div className="glass-panel p-6">
                <div className="flex flex-wrap gap-4 items-end mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Inicio</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-slate-900" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Fin</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-slate-900" />
                        </div>
                    </div>
                    <button onClick={() => generateBillingExcel(groupedData, { start: startDate, end: endDate })} disabled={groupedData.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <Download size={18} />
                        Generar Excel Global
                    </button>
                </div>

                <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" />
                        Pendientes de Facturar ({groupedData.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedData.length > 0 ? groupedData.map(group => (
                            <div key={group.researcher.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-medium text-blue-700">{group.researcher.fullName}</h4>
                                        <p className="text-sm text-slate-500">{group.researcher.institution} - Tarifa {group.researcher.tariff}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500">Total Servicios</p>
                                        <p className="text-xl font-bold text-green-600">{(group.total * 1.21).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-sm text-slate-500">
                                        <p>{group.items.length} servicios</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleGenerateInvoice(group)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-2"><DollarSign size={16} /> Generar</button>
                                        <button onClick={() => openPrintPreview(group)} className="text-slate-600 bg-slate-200 px-3 py-1 rounded text-sm flex items-center gap-2"><Printer size={16} /> Vista Previa</button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-3 text-center py-8 text-slate-500 border border-dashed rounded-lg">No hay pendientes.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                    <CheckCircle className="text-green-600" size={20} />
                    Historial de Facturas
                </h3>

                <DataTable
                    columns={columns}
                    data={enrichedInvoices}
                    globalFilter={globalFilter}
                    onGlobalFilterChange={setGlobalFilter}
                    pageSize={15}
                    meta={{ updateStatus, markAsDispatched }}
                    emptyMessage="No hay facturas generadas."
                />
            </div>

            {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col relative">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-100 rounded-t-lg">
                            <h3 className="font-bold text-slate-800">Vista Previa</h3>
                            <div className="flex gap-2">
                                <PDFDownloadLink
                                    document={<InvoicePDF
                                        invoice={selectedInvoice}
                                        researcher={selectedInvoice.researcher}
                                        requests={selectedInvoice.items}
                                        services={services}
                                    />}
                                    fileName={`Factura_${selectedInvoice.invoiceNumber}.pdf`}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
                                >
                                    {({ loading }) => (loading ? 'Generando...' : <><FileDown size={18} /> PDF</>)}
                                </PDFDownloadLink>
                                <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded">Imprimir</button>
                                <button onClick={() => setSelectedInvoice(null)} className="text-slate-500"><X size={24} /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto bg-slate-500 p-8">
                            <div className="shadow-2xl mx-auto max-w-[210mm] bg-white">
                                <InvoiceTemplate ref={invoiceRef} data={selectedInvoice} invoiceNumber={selectedInvoice.invoiceNumber} date={selectedInvoice.date} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
