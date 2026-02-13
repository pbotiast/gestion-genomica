import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar, Download, DollarSign, FileText, Printer, X, CheckCircle } from 'lucide-react';
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
    const invoiceRef = useRef();

    // Sort config for History Table
    const [sortConfig, setSortConfig] = useState({ key: 'invoiceNumber', direction: 'desc' });

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

    // Sort Logic for History
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedInvoices = [...invoices].map(inv => {
        const researcher = researchers.find(r => r.id === inv.researcherId);
        return { ...inv, researcherName: researcher?.fullName || '' };
    }).sort((a, b) => {
        if (!sortConfig.key) return 0;
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span className="text-slate-300 ml-1 text-[10px]">▼</span>;
        return <span className="text-blue-600 ml-1 font-bold text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
        <div className="space-y-6">
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

                <div className={styles.tableContainer}>
                    <div className="hidden md:block">
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('invoiceNumber')}>
                                        <div className={styles.thContent}>Nº Factura <SortIcon columnKey="invoiceNumber" /></div>
                                    </th>
                                    <th onClick={() => handleSort('createdAt')}>
                                        <div className={styles.thContent}>Fecha <SortIcon columnKey="createdAt" /></div>
                                    </th>
                                    <th onClick={() => handleSort('researcherName')}>
                                        <div className={styles.thContent}>Investigador <SortIcon columnKey="researcherName" /></div>
                                    </th>
                                    <th onClick={() => handleSort('amount')}>
                                        <div className={styles.thContent} style={{ justifyContent: 'flex-end' }}>Importe <SortIcon columnKey="amount" /></div>
                                    </th>
                                    <th className={styles.colActions}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedInvoices.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center p-8 text-slate-500">No hay facturas.</td></tr>
                                ) : (
                                    sortedInvoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td className={styles.invoiceNumber + " border-r px-2"}>{inv.invoiceNumber}</td>
                                            <td className="border-r px-2">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                            <td className="border-r px-2">{inv.researcherName}</td>
                                            <td className={styles.amount + " border-r px-2"}>{inv.amount?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                            <td className={styles.colActions}>
                                                <div className="flex justify-center">
                                                    <button onClick={() => openPrintPreview(inv)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Printer size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden space-y-3 p-4">
                        {sortedInvoices.map(inv => (
                            <div key={inv.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="font-mono font-bold text-slate-700 block">{inv.invoiceNumber}</span>
                                        <span className="text-xs text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <span className="font-bold text-green-600">{inv.amount?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                                </div>
                                <div className="text-sm text-slate-600 border-t border-slate-100 pt-2 mt-1">
                                    {inv.researcherName}
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button onClick={() => openPrintPreview(inv)} className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm flex items-center gap-1"><Printer size={16} /> Imprimir</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col relative">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-100 rounded-t-lg">
                            <h3 className="font-bold text-slate-800">Vista Previa</h3>
                            <div className="flex gap-2">
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
