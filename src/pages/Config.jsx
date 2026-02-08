import React, { useState } from 'react';
import { Plus, Trash2, Settings, Users, Box } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import styles from './Config.module.css';

const Config = () => {
    const { technicians, addTechnician, deleteTechnician, formats, addFormat, deleteFormat } = useAppContext();
    const [newTech, setNewTech] = useState('');
    const [newFormat, setNewFormat] = useState('');

    const handleAddTech = (e) => {
        e.preventDefault();
        if (newTech.trim()) {
            addTechnician(newTech.trim());
            setNewTech('');
        }
    };

    const handleAddFormat = (e) => {
        e.preventDefault();
        if (newFormat.trim()) {
            addFormat(newFormat.trim());
            setNewFormat('');
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <h1 className={cn(styles.title, "text-gradient")}>Configuración</h1>
                <p className={styles.subtitle}>Gestión de parámetros del sistema</p>
            </div>

            <div className={styles.grid}>
                {/* Técnicos Panel */}
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                        <Users className="text-indigo-400" />
                        <h2 className="text-xl font-bold">Técnicos Gestores</h2>
                    </div>

                    <form onSubmit={handleAddTech} className="flex gap-2 mb-6">
                        <input
                            value={newTech}
                            onChange={(e) => setNewTech(e.target.value)}
                            placeholder="Nombre del técnico..."
                            className="flex-1"
                        />
                        <button type="submit" disabled={!newTech.trim()} className="btn-primary p-2">
                            <Plus size={20} />
                        </button>
                    </form>

                    <ul className={styles.list}>
                        {technicians.map((tech, idx) => (
                            <li key={idx} className={styles.listItem}>
                                <span>{tech}</span>
                                <button onClick={() => deleteTechnician(tech)} className={styles.deleteBtn}>
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                        {technicians.length === 0 && <li className="text-slate-500 italic">No hay técnicos registrados.</li>}
                    </ul>
                </div>

                {/* Formatos Panel */}
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                        <Box className="text-cyan-400" />
                        <h2 className="text-xl font-bold">Formatos de Servicio</h2>
                    </div>

                    <form onSubmit={handleAddFormat} className="flex gap-2 mb-6">
                        <input
                            value={newFormat}
                            onChange={(e) => setNewFormat(e.target.value)}
                            placeholder="Nuevo formato..."
                            className="flex-1"
                        />
                        <button type="submit" disabled={!newFormat.trim()} className="btn-primary p-2">
                            <Plus size={20} />
                        </button>
                    </form>

                    <ul className={styles.list}>
                        {formats.map((fmt, idx) => (
                            <li key={idx} className={styles.listItem}>
                                <span>{fmt}</span>
                                <button onClick={() => deleteFormat(fmt)} className={styles.deleteBtn}>
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                        {formats.length === 0 && <li className="text-slate-500 italic">No hay formatos registrados.</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Config;
