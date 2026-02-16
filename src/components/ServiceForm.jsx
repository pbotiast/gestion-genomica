import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import styles from './ServiceForm.module.css';

const ServiceForm = ({ onSubmit, onCancel, initialData }) => {
    const { formats } = useAppContext();
    const [formData, setFormData] = useState(initialData || {
        name: '',
        format: '',
        priceA: '',
        priceB: '',
        priceC: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            priceA: Number(formData.priceA),
            priceB: Number(formData.priceB),
            priceC: Number(formData.priceC)
        });
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.section}>
                <div className={styles.inputGroup}>
                    <label>Nombre del Servicio</label>
                    <input required name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Secuenciación Sanger" />
                </div>

                <div className={styles.inputGroup}>
                    <label>Formato</label>
                    <select required name="format" value={formData.format} onChange={handleChange} className={styles.select}>
                        <option value="">Seleccionar Formato...</option>
                        {formats.map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Tarifas (€)</h3>
                <div className={styles.grid3}>
                    <div className={styles.inputGroup}>
                        <label>Tarifa A (UCM)</label>
                        <input required type="number" step="0.01" name="priceA" value={formData.priceA} onChange={handleChange} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Tarifa B (Pública)</label>
                        <input required type="number" step="0.01" name="priceB" value={formData.priceB} onChange={handleChange} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Tarifa C (Privada)</label>
                        <input required type="number" step="0.01" name="priceC" value={formData.priceC} onChange={handleChange} />
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <button type="button" onClick={onCancel} className="btn-secondary">
                    Cancelar
                </button>
                <button type="submit" className="btn-primary flex items-center gap-2">
                    <Save size={18} />
                    {initialData ? 'Actualizar Servicio' : 'Guardar Servicio'}
                </button>
            </div>
        </form>
    );
};

export default ServiceForm;
