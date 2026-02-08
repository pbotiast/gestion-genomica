import React, { useState } from 'react';
import { Plus, Search, CheckCircle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import RequestForm from '../components/RequestForm';
import styles from './Requests.module.css'; // Clone from Researchers or create new

const Requests = () => {
    const { requests, setRequests } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRequests = requests.filter(r =>
        (r.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.researcherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = (data) => {
        setRequests(prev => [data, ...prev]);
        setIsModalOpen(false);
    };

    const handleCloseRequest = (id) => {
        // Logic to set resultSentDate?
        const date = new Date().toISOString().split('T')[0];
        setRequests(prev => prev.map(r => r.registrationNumber === id ? { ...r, resultSentDate: date } : r));
    };

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Solicitudes</h1>
                    <p className={styles.subtitle}>Gestión de trabajo y seguimiento</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
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
                                <th>Servicio</th>
                                <th>Muestras</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center p-8 text-slate-500">
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
                                        <td>{req.serviceName}</td>
                                        <td>{req.samplesCount}</td>
                                        <td>
                                            {req.resultSentDate ? (
                                                <span className={cn(styles.badge, styles.badgeDone)}>Completado</span>
                                            ) : (
                                                <span className={cn(styles.badge, styles.badgePending)}>En Proceso</span>
                                            )}
                                        </td>
                                        <td>
                                            {!req.resultSentDate && (
                                                <button onClick={() => handleCloseRequest(req.registrationNumber)} title="Marcar completado" className={styles.actionBtn}>
                                                    <CheckCircle size={18} />
                                                </button>
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
                            <h2 className={styles.modalTitle}>Registrar Solicitud</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <RequestForm onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Requests;
