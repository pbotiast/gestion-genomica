import React, { useState } from 'react';
import { Plus, Search, CheckCircle, X, FilePenLine, Send, RotateCcw, Trash2, DollarSign, FileDown } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import RequestPDF from '../components/pdf/RequestPDF';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import RequestForm from '../components/RequestForm';
import styles from './Requests.module.css';

const Requests = () => {
    const context = useAppContext();
    console.log('Requests context:', context);
    const { requests, researchers, services, updateRequestStatus, createRequest, updateRequest, deleteRequest } = context;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'registrationNumber', direction: 'desc' }); // Default sort

    const statusLabels = {
        pending: 'Pendiente',
        received: 'Recibido',
        analysis: 'En Análisis',
        validation: 'Validación',
        completed: 'Completado',
        processed: 'Facturación', // "Processed" para nosotros es listo para facturar/enviado a facturación
        billed: 'Facturado'
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return styles.badgePending;
            case 'received': return styles.badgeReceived;
            case 'analysis': return styles.badgeAnalysis;
            case 'validation': return styles.badgeValidation;
            case 'completed': return styles.badgeCompleted;
            case 'processed': return styles.badgeDone;
            case 'billed': return styles.badgeBilled;
            default: return styles.badgePending;
        }
    };

    const filteredRequests = requests.map(req => {
        // Enrich request data with lookups
        // Loose equality check for IDs (string vs number)
        const researcher = researchers.find(r => r.id == req.researcherId);
        const service = services.find(s => s.id == req.serviceId);
        return {
            ...req,
            researcherName: researcher ? researcher.fullName : (req.researcherName || 'Desconocido'),
            institution: researcher ? (researcher.center || researcher.institution) : (req.institution || '-'),
            serviceName: service ? service.name : (req.serviceName || 'Desconocido'),
            serviceFormat: service ? service.format : (req.format || ''),
            // Ensure format is taken from request if overriding, or service default
        };
    }).filter(r =>
        (r.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.researcherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.institution || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedRequests = [...filteredRequests].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';

        // Numeric sort for specific fields if needed, currently string compare works well for most
        // Custom handling for date if needed

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span className="text-slate-300 ml-1 text-[10px]">▼</span>;
        return <span className="text-blue-600 ml-1 font-bold text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    const handleCreate = async (data) => {
        try {
            await createRequest(data);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error creating request:", error);
            alert("Error al crear la solicitud");
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
            alert("Error al actualizar la solicitud");
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
            console.error("Error updating request:", error);
        }
    };

    const handleRestore = async (id) => {
        if (!confirm('¿Está seguro de restaurar esta solicitud? Volverá a estado pendiente.')) return;
        try {
            await updateRequestStatus(id, 'pending');
        } catch (error) {
            console.error("Error restoring request:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Está seguro de eliminar esta solicitud permanentemente?')) return;
        try {
            await deleteRequest(id);
        } catch (error) {
            console.error("Error deleting request:", error);
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Solicitudes</h1>
                    <p className={styles.subtitle}>Gestión de trabajo y seguimiento</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    Nueva Solicitud
                </button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} className="text-slate-500" />
                    <input
                        placeholder="Buscar por registro, investigador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            <div className={styles.tableContainer}>
                {/* Desktop Table - Grid Style */}
                <div className={styles.desktopView}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.colId} onClick={() => handleSort('registrationNumber')}>
                                    <div className={styles.thContent}>Registro <SortIcon columnKey="registrationNumber" /></div>
                                </th>
                                <th className={styles.colDate} onClick={() => handleSort('entryDate')}>
                                    <div className={styles.thContent}>Fecha <SortIcon columnKey="entryDate" /></div>
                                </th>
                                <th onClick={() => handleSort('researcherName')}>
                                    <div className={styles.thContent}>Investigador <SortIcon columnKey="researcherName" /></div>
                                </th>
                                <th onClick={() => handleSort('institution')}>
                                    <div className={styles.thContent}>Institución <SortIcon columnKey="institution" /></div>
                                </th>
                                <th onClick={() => handleSort('requestedBy')}>
                                    <div className={styles.thContent}>Solicitado Por <SortIcon columnKey="requestedBy" /></div>
                                </th>
                                <th onClick={() => handleSort('serviceName')}>
                                    <div className={styles.thContent}>Servicio <SortIcon columnKey="serviceName" /></div>
                                </th>
                                <th title="Muestras Procesadas / Totales">
                                    <div className={styles.thContent}>Muestras</div>
                                </th>
                                <th className={styles.colStatus} onClick={() => handleSort('status')}>
                                    <div className={styles.thContent}>Estado <SortIcon columnKey="status" /></div>
                                </th>
                                <th className={styles.colActions}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center p-8 text-slate-500">
                                        No hay solicitudes registradas que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                sortedRequests.map((req, idx) => (
                                    <tr key={idx}>
                                        <td className="font-mono font-medium text-slate-700 text-center border-r">{req.registrationNumber}</td>
                                        <td className="text-center border-r">{req.entryDate}</td>
                                        <td className="border-r" title={req.researcherName}>{req.researcherName}</td>
                                        <td className="border-r" title={req.institution}>{req.institution}</td>
                                        <td className="border-r">{req.requestedBy || '-'}</td>
                                        <td className="border-r">
                                            <span className="font-medium">{req.serviceName}</span>
                                            {req.format && <span className="text-xs text-slate-500 ml-1">({req.format})</span>}
                                        </td>
                                        <td className="text-center border-r">
                                            {req.finalSamplesCount || '-'} / {req.samplesCount}
                                        </td>
                                        <td className="text-center border-r">
                                            <span className={cn(styles.badge, getStatusStyle(req.status))}>
                                                {statusLabels[req.status] || req.status}
                                            </span>
                                        </td>
                                        <td className={styles.colActions}>
                                            <div className="flex justify-center gap-1">
                                                {req.status === 'pending' && <button onClick={() => updateRequestStatus(req.id, 'received')} title="Recibir" className="text-amber-600 hover:bg-amber-100 p-0.5 rounded"><CheckCircle size={14} /></button>}
                                                {req.status === 'received' && <button onClick={() => updateRequestStatus(req.id, 'analysis')} title="Analizar" className="text-blue-600 hover:bg-blue-100 p-0.5 rounded"><CheckCircle size={14} /></button>}
                                                {req.status === 'analysis' && <button onClick={() => updateRequestStatus(req.id, 'validation')} title="Validar" className="text-purple-600 hover:bg-purple-100 p-0.5 rounded"><CheckCircle size={14} /></button>}
                                                {req.status === 'validation' && <button onClick={() => updateRequestStatus(req.id, 'completed')} title="Completar" className="text-emerald-600 hover:bg-emerald-100 p-0.5 rounded"><CheckCircle size={14} /></button>}

                                                <button onClick={() => openEditModal(req)} title="Editar" className="text-slate-500 hover:text-blue-600 hover:bg-slate-100 p-0.5 rounded"><FilePenLine size={14} /></button>

                                                {req.status === 'completed' && <button onClick={() => handleFinalize(req.id)} title="Facturar" className="text-emerald-600 hover:bg-emerald-50 p-0.5 rounded font-bold text-xs">$</button>}
                                                <button onClick={() => handleDelete(req.id)} title="Eliminar" className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-0.5 rounded"><Trash2 size={14} /></button>
                                                {req.status === 'processed' && <button onClick={() => handleRestore(req.id)} title="Restaurar" className="text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 p-0.5 rounded"><RotateCcw size={14} /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className={cn(styles.mobileView, "space-y-4 p-4")}>
                    {filteredRequests.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                            No hay solicitudes registradas.
                        </div>
                    ) : (
                        filteredRequests.map((req, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-indigo-700 font-bold text-lg">{req.registrationNumber}</span>
                                        <span className="text-xs text-slate-400">{req.entryDate}</span>
                                    </div>
                                    <span className={cn(styles.badge, getStatusStyle(req.status))}>
                                        {statusLabels[req.status] || req.status}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider">Investigador</span>
                                        <span className="font-medium text-slate-900">{req.researcherName}</span>
                                        <span className="text-xs text-slate-500">{req.institution}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-slate-500 uppercase tracking-wider block">Servicio</span>
                                            <span className="text-sm font-medium">{req.serviceName}</span>
                                            <div className="text-xs text-slate-500">{req.format}</div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 uppercase tracking-wider block">Muestras</span>
                                            <div className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-sm mt-1">
                                                <span className="font-medium">{req.finalSamplesCount || '-'}</span>
                                                <span className="text-xs text-slate-400">/ {req.samplesCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 flex-wrap">
                                    {/* Mobile Actions */}
                                    {req.status === 'pending' && <button onClick={() => updateRequestStatus(req.id, 'received')} className="btn-secondary text-xs py-1 px-3 text-amber-600 border-amber-200 bg-amber-50">Recibir</button>}
                                    {req.status === 'received' && <button onClick={() => updateRequestStatus(req.id, 'analysis')} className="btn-secondary text-xs py-1 px-3 text-blue-600 border-blue-200 bg-blue-50">Analizar</button>}
                                    {req.status === 'analysis' && <button onClick={() => updateRequestStatus(req.id, 'validation')} className="btn-secondary text-xs py-1 px-3 text-purple-600 border-purple-200 bg-purple-50">Validar</button>}
                                    {req.status === 'validation' && <button onClick={() => updateRequestStatus(req.id, 'completed')} className="btn-secondary text-xs py-1 px-3 text-emerald-600 border-emerald-200 bg-emerald-50">Completar</button>}

                                    <button onClick={() => openEditModal(req)} className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 rounded-full"><FilePenLine size={18} /></button>

                                    {req.status === 'completed' && <button onClick={() => handleFinalize(req.id)} className="p-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full"><DollarSign size={18} /></button>}
                                    {(req.status === 'pending' || req.status === 'completed') && <button onClick={() => handleDelete(req.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-full"><Trash2 size={18} /></button>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={cn("glass-panel", styles.modalContent)}>
                        <div className={styles.modalHeader}>
                            <div className="flex items-center gap-3">
                                <h2 className={styles.modalTitle}>{isEditMode ? 'Editar Solicitud' : 'Registrar Solicitud'}</h2>
                                {isEditMode && currentRequest && (
                                    <PDFDownloadLink
                                        document={<RequestPDF
                                            request={currentRequest}
                                            researcher={researchers.find(r => r.id == currentRequest.researcherId)}
                                            service={services.find(s => s.id == currentRequest.serviceId)}
                                        />}
                                        fileName={`Solicitud_${currentRequest.registrationNumber}.pdf`}
                                        className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 hover:bg-red-100 flex items-center gap-1 font-medium"
                                    >
                                        {({ loading }) => (loading ? 'Generando...' : <><FileDown size={14} /> PDF</>)}
                                    </PDFDownloadLink>
                                )}
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <RequestForm
                                onSubmit={isEditMode ? handleUpdate : handleCreate}
                                onCancel={() => setIsModalOpen(false)}
                                initialData={currentRequest}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Requests;
