import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import ResearcherForm from '../components/ResearcherForm';
import { cn } from '../lib/utils';
import styles from './Researchers.module.css';

const Researchers = () => {
    const { researchers, addResearcher, deleteResearcher } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredResearchers = researchers.filter(r =>
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.institution.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = (data) => {
        addResearcher(data);
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Investigadores</h1>
                    <p className={styles.subtitle}>Gestión de usuarios y tarifas</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    Nuevo Investigador
                </button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} className="text-slate-400" />
                    <input
                        placeholder="Buscar por nombre o institución..."
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
                                <th>Nombre</th>
                                <th>Institución</th>
                                <th>Tarifa</th>
                                <th>Email</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResearchers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center p-8 text-slate-500">
                                        No se encontraron investigadores.
                                    </td>
                                </tr>
                            ) : (
                                filteredResearchers.map(researcher => (
                                    <tr key={researcher.id}>
                                        <td className="font-medium">{researcher.fullName}</td>
                                        <td>{researcher.institution}</td>
                                        <td>
                                            <span className={cn(styles.badge, styles[`badge${researcher.tariff}`])}>
                                                Tarifa {researcher.tariff}
                                            </span>
                                        </td>
                                        <td className="text-slate-400">{researcher.email}</td>
                                        <td>
                                            <button onClick={() => deleteResearcher(researcher.id)} className={styles.actionBtn}>
                                                <Trash2 size={16} />
                                            </button>
                                            {/* Edit not implemented in prototype for brevity, but model supports it */}
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
                            <h2 className={styles.modalTitle}>Nuevo Investigador</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <ResearcherForm onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Researchers;
