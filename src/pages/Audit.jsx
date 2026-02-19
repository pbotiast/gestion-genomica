import React, { useEffect, useState, useMemo } from 'react';
import DataTable from '../components/DataTable';
import { Badge } from '../components/UI';
import { cn } from '../lib/utils';
import { ClipboardList, RefreshCw, Eye, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import styles from './Audit.module.css';

const Audit = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        action: '',
        entity: ''
    });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.action) params.append('action', filters.action);
            if (filters.entity) params.append('entity', filters.entity);

            const data = await api.get(`/audit?${params}`);
            setLogs(data);
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const formatDetails = (details) => {
        try {
            const obj = JSON.parse(details);
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return details;
        }
    };

    const getActionBadge = (action) => {
        const variants = {
            'CREATE': 'success',
            'UPDATE': 'info',
            'DELETE': 'danger',
            'LOGIN': 'primary',
            'LOGOUT': 'secondary'
        };
        return variants[action] || 'secondary';
    };

    // Define columns for DataTable
    const columns = useMemo(() => [
        {
            accessorKey: 'timestamp',
            header: 'Fecha/Hora',
            cell: ({ getValue }) => {
                const date = new Date(getValue());
                return (
                    <div className="text-xs">
                        <div className="font-medium text-slate-700">
                            {date.toLocaleDateString('es-ES')}
                        </div>
                        <div className="text-slate-500">
                            {date.toLocaleTimeString('es-ES')}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'user',
            header: 'Usuario',
            cell: ({ getValue }) => (
                <span className="font-medium text-slate-800">{getValue() || 'Sistema'}</span>
            ),
        },
        {
            accessorKey: 'action',
            header: 'Acción',
            cell: ({ getValue }) => (
                <Badge variant={getActionBadge(getValue())}>
                    {getValue()}
                </Badge>
            ),
        },
        {
            accessorKey: 'entity',
            header: 'Entidad',
            cell: ({ getValue }) => (
                <span className="text-slate-700 uppercase text-xs font-medium">
                    {getValue()}
                </span>
            ),
        },
        {
            accessorKey: 'entityId',
            header: 'ID',
            cell: ({ getValue }) => (
                <span className="text-slate-600">#{getValue()}</span>
            ),
        },
        {
            id: 'actions',
            header: 'Detalles',
            cell: ({ row }) => {
                const log = row.original;
                return (
                    <button
                        onClick={() => setSelectedLog(log)}
                        className="btn-icon-sm text-blue-600 hover:text-blue-800"
                        title="Ver detalles"
                    >
                        <Eye size={16} />
                    </button>
                );
            },
        },
    ], []);

    return (
        <div className="space-y-6 fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Auditoría del Sistema</h1>
                    <p className={styles.subtitle}>Registro de actividad y cambios en el sistema</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="btn-secondary flex items-center gap-2"
                    disabled={loading}
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Actualizar
                </button>
            </header>

            {/* Filters */}
            <div className="glass-panel p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Calendar size={16} />
                    Filtros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Fecha Inicio</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Fecha Fin</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Acción</label>
                        <select
                            value={filters.action}
                            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm"
                        >
                            <option value="">Todas</option>
                            <option value="CREATE">Crear</option>
                            <option value="UPDATE">Modificar</option>
                            <option value="DELETE">Eliminar</option>
                            <option value="LOGIN">Login</option>
                            <option value="LOGOUT">Logout</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Entidad</label>
                        <select
                            value={filters.entity}
                            onChange={(e) => setFilters(prev => ({ ...prev, entity: e.target.value }))}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm"
                        >
                            <option value="">Todas</option>
                            <option value="REQUEST">Solicitudes</option>
                            <option value="RESEARCHER">Investigadores</option>
                            <option value="SERVICE">Servicios</option>
                            <option value="CENTER">Centros</option>
                            <option value="INVOICE">Facturas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Audit DataTable */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <ClipboardList size={20} className="text-indigo-600" />
                    Registros de Auditoría ({logs.length})
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
                            <p className="text-slate-600">Cargando registros...</p>
                        </div>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={logs}
                        globalFilter={globalFilter}
                        onGlobalFilterChange={setGlobalFilter}
                        pageSize={20}
                        emptyMessage="No hay registros de auditoría."
                    />
                )}
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800">Detalles del Registro</h3>
                            <div className="mt-2 flex gap-2">
                                <Badge variant={getActionBadge(selectedLog.action)}>
                                    {selectedLog.action}
                                </Badge>
                                <span className="text-sm text-slate-600">
                                    {selectedLog.entity} #{selectedLog.entityId}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Usuario</label>
                                    <p className="text-sm text-slate-800">{selectedLog.user || 'Sistema'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Fecha y Hora</label>
                                    <p className="text-sm text-slate-800">
                                        {new Date(selectedLog.timestamp).toLocaleString('es-ES')}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 block mb-2">Cambios (JSON)</label>
                                    <pre className="text-xs bg-slate-50 p-4 rounded border border-slate-200 overflow-auto">
                                        {formatDetails(selectedLog.details)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="btn-secondary"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Audit;
