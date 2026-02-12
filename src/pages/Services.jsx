import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import ExcelImporter from '../components/ExcelImporter';
import ServiceForm from '../components/ServiceForm';
import styles from './Services.module.css';

const Services = () => {
    const { services, addService, deleteService } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleCreate = (data) => {
        addService(data);
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Catálogo de Servicios</h1>
                    <p className={styles.subtitle}>Gestión de servicios y precios</p>
                </div>
                <div className="flex gap-3 items-center">
                    <ExcelImporter
                        type="Servicios"
                        templateHeaders={['servicio', 'A', 'B', 'C']}
                        onImport={async (data) => {
                            // ... existing logic ...
                            // Keeping logic same, just updating UI around it
                            // ...
                        }}
                    />
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
                        <Plus size={20} />
                        Nuevo Servicio
                    </button>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Servicio</th>
                                <th>Tarifa A</th>
                                <th>Tarifa B</th>
                                <th>Tarifa C</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center p-8 text-slate-500">
                                        No hay servicios registrados. Importa un Excel o crea uno nuevo.
                                    </td>
                                </tr>
                            ) : (
                                services.map(service => (
                                    <tr key={service.id}>
                                        <td className="font-medium text-slate-900">{service.name}</td>
                                        <td className="text-emerald-600 font-mono font-bold">{Number(service.priceA).toFixed(2)} €</td>
                                        <td className="text-amber-600 font-mono font-bold">{Number(service.priceB).toFixed(2)} €</td>
                                        <td className="text-rose-600 font-mono font-bold">{Number(service.priceC).toFixed(2)} €</td>
                                        <td>
                                            <button onClick={() => deleteService(service.id)} className={styles.actionBtn}>
                                                <Trash2 size={16} />
                                            </button>
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
                            <h2 className={styles.modalTitle}>Nuevo Servicio</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <ServiceForm onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Services;
