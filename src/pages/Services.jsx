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
                            // Helper to parse currency string carefully
                            const parsePrice = (val) => {
                                if (val === undefined || val === null) return 0;
                                if (typeof val === 'number') return val;

                                let str = val.toString();
                                // User confirmed: "1.297,00 €" -> Comma thousands, Dot decimal? NO wait.
                                // User image: "1,297.00 €". 
                                // Comma = Thousands. Dot = Decimal.
                                // Logic: Strip non-numeric/non-dot/non-minus.
                                str = str.replace(/[^0-9.-]/g, '');

                                return parseFloat(str) || 0;
                            };

                            // Helper for fuzzy column matching
                            const getCol = (row, ...options) => {
                                for (const opt of options) {
                                    if (row[opt] !== undefined) return row[opt];
                                    // Try lowercase
                                    const lower = opt.toLowerCase();
                                    const key = Object.keys(row).find(k => k.toLowerCase() === lower);
                                    if (key) return row[key];
                                }
                                return undefined;
                            };

                            const mapped = data.map(row => ({
                                name: getCol(row, 'servicio', 'Servicio', 'Nombre del servicio', 'Nombre'),
                                categoryId: 'general',
                                format: '', // Removed per user request (independent of service)
                                priceA: parsePrice(getCol(row, 'A', 'Tarifa A', 'Precio A', 'a')),
                                priceB: parsePrice(getCol(row, 'B', 'Tarifa B', 'Precio B', 'b')),
                                priceC: parsePrice(getCol(row, 'C', 'Tarifa C', 'Precio C', 'c'))
                            })).filter(s => s.name);

                            // Bulk add
                            for (const s of mapped) {
                                await addService(s);
                            }
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
                                        <td className="font-medium">{service.name}</td>
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
