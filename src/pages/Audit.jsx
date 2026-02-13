import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { ClipboardList, RefreshCw } from 'lucide-react';

const Audit = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/audit');
            const data = await res.json();
            setLogs(data);
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const formatDetails = (details) => {
        try {
            const obj = JSON.parse(details);
            // Return a simplified string representation
            return Object.entries(obj)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
        } catch (e) {
            return details;
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'UPDATE': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'DELETE': return 'text-rose-600 bg-rose-50 border-rose-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Registro de Auditoría
                    </h1>
                    <p className="text-slate-500">Historial de cambios y acciones del sistema</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-2 text-slate-500 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all"
                    title="Actualizar"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </header>

            <div className="glass-panel text-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/50">
                                <th className="p-4 font-semibold text-slate-500 text-sm">Fecha</th>
                                <th className="p-4 font-semibold text-slate-500 text-sm">Acción</th>
                                <th className="p-4 font-semibold text-slate-500 text-sm">Entidad</th>
                                <th className="p-4 font-semibold text-slate-500 text-sm">ID</th>
                                <th className="p-4 font-semibold text-slate-500 text-sm">Usuario</th>
                                <th className="p-4 font-semibold text-slate-500 text-sm">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                                        No hay registros de auditoría disponibles.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 text-sm font-mono text-slate-600 w-48">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={cn("px-2 py-0.5 rounded text-xs font-bold border", getActionColor(log.action))}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-700">
                                            {log.entity}
                                        </td>
                                        <td className="p-4 text-sm font-mono text-slate-500">
                                            {log.entityId}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {log.user}
                                        </td>
                                        <td className="p-4 text-xs text-slate-500 max-w-md truncate" title={formatDetails(log.details)}>
                                            {formatDetails(log.details)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Audit;
