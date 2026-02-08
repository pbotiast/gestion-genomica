import React, { useState, useRef } from 'react';
import { Plus, Upload, Trash2, X, FileSpreadsheet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { parseServicesExcel } from '../lib/excel';
import ServiceForm from '../components/ServiceForm';
import styles from './Services.module.css';

const Services = () => {
    const { services, addService, deleteService } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    const handleCreate = (data) => {
        addService(data);
        setIsModalOpen(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploadError('');
            const data = await parseServicesExcel(file);
            if (data.length === 0) {
                setUploadError('No se encontraron servicios válidos en el archivo.');
                return;
            }
            addService(data);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error(error);
            setUploadError('Error al procesar el archivo Excel. Asegúrate de tener las columnas: Servicio, Formato, Precio A, Precio B, Precio C.');
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Catálogo de Servicios</h1>
                    <p className={styles.subtitle}>Gestión de servicios y precios</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex items-center gap-2">
                        <Upload size={20} />
                        Importar Excel
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
                        <Plus size={20} />
                        Nuevo Servicio
                    </button>
                </div>
            </div>

            {uploadError && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg">
                    {uploadError}
                </div>
            )}

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Servicio</th>
                                <th>Formato</th>
                                <th>Tarifa A</th>
                                <th>Tarifa B</th>
                                <th>Tarifa C</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center p-8 text-slate-500">
                                        No hay servicios registrados. Importa un Excel o crea uno nuevo.
                                    </td>
                                </tr>
                            ) : (
                                services.map(service => (
                                    <tr key={service.id}>
                                        <td className="font-medium">{service.name}</td>
                                        <td><span className={styles.formatBadge}>{service.format}</span></td>
                                        <td className="text-emerald-400 font-mono">{Number(service.priceA).toFixed(2)} €</td>
                                        <td className="text-amber-400 font-mono">{Number(service.priceB).toFixed(2)} €</td>
                                        <td className="text-rose-400 font-mono">{Number(service.priceC).toFixed(2)} €</td>
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
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
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
