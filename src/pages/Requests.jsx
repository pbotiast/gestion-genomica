import React, { useState } from 'react';
import { Plus, Search, CheckCircle, X, FilePenLine, Send } from 'lucide-react';
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
                    <Search size={18} className="text-slate-400" />
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
                                        <td className="font-mono text-indigo-300">{req.registrationNumber}</td>
                                        <td>{req.entryDate}</td>
                                        <td>
                                            <div className="font-medium">{req.researcherName}</div>
                                            <div className="text-xs text-slate-500">{req.institution}</div>
                                        </td>
                                        <td>
                                            <span className="text-sm text-slate-300">{req.requestedBy || '-'}</span>
                                        </td>
                                        <td>{req.serviceName}</td>
                                        <td>{req.samplesCount}</td>
                                        <td>
                                            {req.status === 'processed' ? (
                                                <span className={cn(styles.badge, styles.badgeDone)}>Facturación</span>
                                            ) : (
                                                <span className={cn(styles.badge, styles.badgePending)}>En Proceso</span>
                                            )}
                                        </td>
                                        <td>
                                            {req.status !== 'processed' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openEditModal(req)}
                                                        title="Editar Solicitud"
                                                        className="text-blue-400 hover:text-blue-300 p-1"
                                                    >
                                                        <FilePenLine size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleFinalize(req.id)}
                                                        title="Finalizar y Enviar a Facturación"
                                                        className="text-emerald-400 hover:text-emerald-300 p-1"
                                                    >
                                                        <Send size={18} />
                                                    </button>
                                                </div>
                                            )}
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
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
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
