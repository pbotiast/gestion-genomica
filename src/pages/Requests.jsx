import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Send, RotateCcw, FileDown } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import RequestPDF from '../components/pdf/RequestPDF';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { Badge } from '../components/UI';
import DataTable from '../components/DataTable';
import RequestForm from '../components/RequestForm';
import Modal from '../components/Modal';
import styles from './Requests.module.css';

const Requests = () => {
    const { requests, researchers, services, updateRequestStatus, createRequest, updateRequest, deleteRequest } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');

    const statusLabels = {
        pending: 'Pendiente',
        received: 'Recibido',
        analysis: 'En Análisis',
        validation: 'Validación',
        completed: 'Completado',
        processed: 'Facturación',
        billed: 'Facturado'
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            received: 'info',
            analysis: 'purple',
            validation: 'cyan',
            completed: 'success',
            processed: 'info',
            billed: 'success'
        };
        return colors[status] || 'primary';
    };

    // Enrich request data with researcher and service info
    const enrichedRequests = useMemo(() => {
        return requests.map(req => {
            const researcher = researchers.find(r => r.id == req.researcherId);
            const service = services.find(s => s.id == req.serviceId);
            return {
                ...req,
                researcherName: researcher?.fullName || req.researcherName || 'Desconocido',
                institution: researcher?.center || researcher?.institution || req.institution || '-',
                serviceName: service?.name || req.serviceName || 'Desconocido',
                serviceFormat: service?.format || req.format || '',
            };
        });
    }, [requests, researchers, services]);

    // Define table columns with @tanstack/react-table
    const columns = useMemo(() => [
        {
            accessorKey: 'registrationNumber',
            header: 'Nº Registro',
            cell: ({ getValue }) => (
                <span className="font-mono font-semibold text-indigo-600">
                    {getValue() || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'entryDate',
            header: 'Fecha',
            cell: ({ getValue }) => {
                const date = getValue();
                return date ? new Date(date).toLocaleDateString('es-ES') : '-';
            },
        },
        {
            accessorKey: 'researcherName',
            header: 'Investigador',
            cell: ({ getValue }) => (
                <div className="max-w-xs truncate">{getValue()}</div>
            ),
        },
        {
            accessorKey: 'institution',
            header: 'Centro',
            cell: ({ getValue }) => (
                <div className="max-w-xs truncate text-gray-600">{getValue()}</div>
            ),
        },
        {
            accessorKey: 'serviceName',
            header: 'Servicio',
            cell: ({ getValue }) => (
                <div className="max-w-xs truncate">{getValue()}</div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            cell: ({ getValue }) => {
                const status = getValue() || 'pending';
                return (
                    <Badge variant={getStatusColor(status)}>
                        {statusLabels[status] || status}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => {
                const request = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(request);
                            }}
                            className="btn-icon-sm text-indigo-600 hover:text-indigo-800"
                            title="Editar"
                        >
                            <Edit size={16} />
                        </button>

                        {request.status !== 'processed' && request.status !== 'billed' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFinalize(request.id);
                                }}
                                className="btn-icon-sm text-green-600 hover:text-green-800"
                                title="Finalizar y enviar a facturación"
                            >
                                <Send size={16} />
                            </button>
                        )}

                        {(request.status === 'processed' || request.status === 'billed') && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestore(request.id);
                                }}
                                className="btn-icon-sm text-orange-600 hover:text-orange-800"
                                title="Restaurar"
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}

                        <PDFDownloadLink
                            document={<RequestPDF request={request} />}
                            fileName={`solicitud_${request.registrationNumber || request.id}.pdf`}
                            className="btn-icon-sm text-blue-600 hover:text-blue-800"
                            title="Descargar PDF"
                        >
                            <FileDown size={16} />
                        </PDFDownloadLink>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(request.id);
                            }}
                            className="btn-icon-sm text-red-600 hover:text-red-800"
                            title="Eliminar"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                );
            },
        },
    ], [statusLabels]);

    const handleCreate = async (data) => {
        try {
            await createRequest(data);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error creating request:", error);
        }
    };

    const handleUpdate = async (data) => {
        try {
            if (currentRequest) {
                await updateRequest(currentRequest.id, data);
                setIsModalOpen(false);
                setIsEditMode(false);
                setCurrentRequest(null);
            }
        } catch (error) {
            console.error("Error updating request:", error);
        }
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setCurrentRequest(null);
        setIsModalOpen(true);
    };

    const openEditModal = (request) => {
        setIsEditMode(true);
        setCurrentRequest(request);
        setIsModalOpen(true);
    };

    const handleFinalize = async (id) => {
        if (!confirm('¿Está seguro de finalizar esta solicitud y enviarla a facturación?')) return;
        try {
            await updateRequestStatus(id, 'processed');
        } catch (error) {
            console.error("Error finalizing request:", error);
        }
    };

    const handleRestore = async (id) => {
        if (!confirm('¿Restaurar a estado pendiente?')) return;
        try {
            await updateRequestStatus(id, 'pending');
        } catch (error) {
            console.error("Error restoring request:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta solicitud permanentemente?')) return;
        try {
            await deleteRequest(id);
        } catch (error) {
            console.error("Error deleting request:", error);
        }
    };

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Solicitudes</h1>
                    <p className={styles.subtitle}>Gestión de trabajo y seguimiento</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    Nueva Solicitud
                </button>
            </div>

            {/* Search Bar */}
            <div className="glass-panel p-4">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por registro, investigador, servicio, centro..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Professional Data Table */}
            <DataTable
                columns={columns}
                data={enrichedRequests}
                globalFilter={globalFilter}
                onGlobalFilterChange={setGlobalFilter}
                pageSize={20}
            />

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditMode ? 'Editar Solicitud' : 'Nueva Solicitud'}
            >
                <RequestForm
                    onSubmit={isEditMode ? handleUpdate : handleCreate}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={currentRequest}
                />
            </Modal>
        </div>
    );
};

export default Requests;
