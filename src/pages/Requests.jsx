import React, { useState } from 'react';
import { Plus, Search, CheckCircle, X, FilePenLine, Send, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import RequestForm from '../components/RequestForm';
import styles from './Requests.module.css';

const Requests = () => {
    const { requests, updateRequestStatus, createRequest, updateRequest } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRequests = requests.filter(r =>
        (r.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.researcherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nº Registro</th>
                                <th>Fecha</th>
                                <th>Investigador</th>
                                <th>Solicitado Por</th>
                                <th>Servicio</th>
                                <th>Muestras</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center p-8 text-slate-500">
                                        No hay solicitudes registradas.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req, idx) => (
                                    <tr key={idx}>
                                        <td className="font-mono text-indigo-700 font-bold">{req.registrationNumber}</td>
                                        <td className="text-slate-700">{req.entryDate}</td>
                                        <td>
                                            <div className="font-medium text-slate-900">{req.researcherName}</div>
                                            <div className="text-xs text-slate-500">{req.institution}</div>
                                        </td>
                                        <td>
                                            <span className="text-sm text-slate-600">{req.requestedBy || '-'}</span>
                                        </td>
                                        <td className="text-slate-700">{req.serviceName}</td>
                                        <td className="text-slate-700">{req.samplesCount}</td>
                                        <td>
                                            {req.status === 'processed' ? (
                                                <span className={cn(styles.badge, styles.badgeDone)}>Facturación</span>
                                            ) : (
                                                <span className={cn(styles.badge, styles.badgePending)}>En Proceso</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                {req.status !== 'processed' ? (
                                                    <>
                                                        <button
                                                            onClick={() => openEditModal(req)}
                                                            title="Editar Solicitud"
                                                            className="text-blue-600 hover:text-blue-800 p-1"
                                                        >
                                                            <FilePenLine size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleFinalize(req.id)}
                                                            title="Finalizar y Enviar a Facturación"
                                                            className="text-emerald-600 hover:text-emerald-800 p-1"
                                                        >
                                                            <Send size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRestore(req.id)}
                                                        title="Restaurar Solicitud"
                                                        className="text-amber-600 hover:text-amber-800 p-1"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={cn("glass-panel", styles.modalContent)}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{isEditMode ? 'Editar Solicitud' : 'Registrar Solicitud'}</h2>
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
