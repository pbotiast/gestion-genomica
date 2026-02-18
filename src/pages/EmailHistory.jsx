import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import DataTable from '../components/DataTable';
import { FileCheck, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const EmailHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // We need to add this endpoint to the backend first or use a direct DB query via API if available. 
                // Assuming we'll add /api/emails/history endpoint
                const data = await api.get('/emails/history');
                if (data) setHistory(data);
            } catch (error) {
                console.error("Error fetching email history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [api]);

    const columns = useMemo(() => [
        {
            accessorKey: 'sent_at',
            header: 'Fecha',
            cell: ({ getValue }) => format(new Date(getValue()), 'dd/MM/yyyy HH:mm', { locale: es }),
        },
        {
            accessorKey: 'recipient_email',
            header: 'Destinatario',
        },
        {
            accessorKey: 'subject',
            header: 'Asunto',
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            cell: ({ getValue }) => {
                const status = getValue();
                if (status === 'sent') return <span className="flex items-center text-green-600 gap-1"><CheckCircle size={16} /> Enviado</span>;
                if (status === 'failed') return <span className="flex items-center text-red-600 gap-1"><XCircle size={16} /> Fallido</span>;
                return <span className="flex items-center text-yellow-600 gap-1"><Clock size={16} /> Pendiente</span>;
            }
        },
        {
            accessorKey: 'error_message',
            header: 'Error',
            cell: ({ getValue }) => getValue() || '-',
        }
    ], []);

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando historial...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-3">
                        <FileCheck className="text-indigo-600" size={32} />
                        Historial de Trámites
                    </h1>
                    <p className="text-slate-500 mt-1">Registro de envíos a Gestión Económica (CAIs)</p>
                </div>
            </div>

            <div className="glass-panel p-6 border-l-4 border-indigo-500">
                <DataTable
                    data={history}
                    columns={columns}
                    globalFilter={globalFilter}
                    onGlobalFilterChange={setGlobalFilter}
                    pageSize={15}
                    emptyMessage="No hay correos registrados en el historial."
                />
            </div>
        </div>
    );
};

export default EmailHistory;
