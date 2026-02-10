import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar, Download, DollarSign, FileText } from 'lucide-react';
import { generateBillingExcel } from '../lib/excel';

const Billing = () => {
    const { requests, researchers, services, updateRequestStatus } = useAppContext();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Filter requests that are "Processed" and within date range
    const billingData = useMemo(() => {
        if (!startDate || !endDate) return [];

        const start = new Date(startDate);
        const end = new Date(endDate);
        // Include the end date fully
        end.setHours(23, 59, 59, 999);

        // Filter requests: must be 'processed' (or 'completed' depending entirely on your status logic, sticking to 'processed' as per plan)
        // Adjust status check if your app uses 'completed' or something else.
        // Assuming 'processed' is the status for ready-to-bill.
        return requests.filter(req => {
            const reqDate = new Date(req.entryDate || req.createdAt); // Use entryDate as primary
            const statusReady = req.status === 'processed' || req.status === 'completed'; // Be flexible
            return statusReady && reqDate >= start && reqDate <= end;
        });
    }, [requests, startDate, endDate]);

    // Group by Researcher
    const groupedData = useMemo(() => {
        const groups = {};
        billingData.forEach(req => {
            const researcher = researchers.find(r => r.id === req.researcherId);
            if (!researcher) return;

            if (!groups[researcher.id]) {
                groups[researcher.id] = {
                    researcher,
                    items: [],
                    total: 0
                };
            }

            // Calculate cost for this request
            // Request structure: { serviceId, format, count, ... }
            // Service structure: { id, priceA, priceB, priceC, ... }
            const service = services.find(s => s.id === req.serviceId);
            let cost = 0;
            if (service) {
                // Determine tariff based on researcher institution/tariff
                // This logic duplicates ResearcherForm logic, ideally should be a helper or stored on researcher
                const tariff = researcher.tariff || 'C'; // Default to C if not set
                const price = service[`price${tariff}`] || 0;
                // Use finalSamplesCount if available, otherwise samplesCount, otherwise 1
                const quantity = req.finalSamplesCount || req.samplesCount || 1;
                cost = price * quantity;
            }

            // Store quantity for display/excel
            const quantity = req.finalSamplesCount || req.samplesCount || 1;
            groups[researcher.id].items.push({ ...req, serviceName: service?.name, cost, quantity });
            groups[researcher.id].total += cost;
        });
        return Object.values(groups);
    }, [billingData, researchers, services]);

    const handleGenerateInvoice = async () => {
        if (groupedData.length === 0) {
            alert("No hay datos para facturar en este periodo.");
            return;
        }

        try {
            await generateBillingExcel(groupedData, { start: startDate, end: endDate });

            // Optional: Update status to 'billed'
            // billingData.forEach(req => updateRequestStatus(req.id, 'billed'));
            alert(`Se han generado ${groupedData.length} factura(s) exitosamente.`);
        } catch (error) {
            console.error("Error generating invoice:", error);
            alert("Error al generar las facturas.");
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Facturación</h1>
                    <p className="text-slate-400">Generación de facturas por periodo</p>
                </div>
            </header>

            <div className="glass-panel p-6">
                <div className="flex flex-wrap gap-4 items-end mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Fecha Inicio</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200"
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Fecha Fin</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateInvoice}
                        disabled={groupedData.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Download size={18} />
                        Generar Excel
                    </button>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                        <FileText size={20} className="text-blue-400" />
                        Vista Previa ({groupedData.length} Investigadores)
                    </h3>

                    {groupedData.length > 0 ? (
                        <div className="grid gap-4">
                            {groupedData.map(group => (
                                <div key={group.researcher.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-medium text-blue-300">{group.researcher.fullName}</h4>
                                            <p className="text-sm text-slate-400">{group.researcher.institution} - Tarifa {group.researcher.tariff}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-400">Total Servicios</p>
                                            <p className="text-xl font-bold text-green-400">
                                                {(group.total * 1.21).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                <span className="text-xs font-normal text-slate-500 block">(IVA incl.)</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        <p>{group.items.length} servicios realizados</p>
                                        <p>Base Imponible: {group.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500 bg-slate-800/20 rounded-lg border border-slate-800 border-dashed">
                            No hay servicios facturables en el periodo seleccionado.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Billing;
