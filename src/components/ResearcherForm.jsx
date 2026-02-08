import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { cn } from '../lib/utils';
import styles from './ResearcherModal.module.css';

const ResearcherForm = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        institution: '',
        center: '',
        idNumber: '', // CIF/NIF
        email: '',
        phone: '',
        fiscalAddress: '',
        shippingAddress: '',
        billingData: {
            accountingOffice: '',
            managementBody: '',
            processingUnit: '',
            proposingBody: ''
        },
        authorizedUsers: '', // Comma separated or textarea
        tariff: ''
    });

    // Load initial data if editing
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    // Tariff Logic
    useEffect(() => {
        const institution = formData.institution.toLowerCase();
        let tariff = '';
        if (institution.includes('ucm') || institution.includes('complutense')) {
            tariff = 'A';
        } else if (institution.includes('universidad') || institution.includes('fundación') || institution.includes('fundacion') || institution.includes('hospital') || institution.includes('csic')) {
            // Simplistic check for Public/Foundation logic - user can override
            tariff = 'B';
        } else if (institution) {
            tariff = 'C';
        }

        // Only auto-set if empty or we want to enforce. Let's just suggest it.
        // User requirement: "A cada uno... se le asociara un tipo de tarifa según Institucion"
        // So we should update it when institution changes.
        if (tariff && !initialData) { // Don't overwrite on edit unless logic requires it? Let's overwrite for now if calculated
            setFormData(prev => ({ ...prev, tariff }));
        }
    }, [formData.institution]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('billing.')) {
            const billingField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                billingData: { ...prev.billingData, [billingField]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.grid}>
                {/* Sección: Datos Personales */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Datos Personales</h3>
                    <div className={styles.inputGroup}>
                        <label>Nombre y Apellidos</label>
                        <input required name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Ej: Juan Pérez" />
                    </div>
                    <div className={styles.row}>
                        <div className={styles.inputGroup}>
                            <label>Email</label>
                            <input required type="email" name="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Teléfono</label>
                            <input required name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>CIF / NIF</label>
                        <input required name="idNumber" value={formData.idNumber} onChange={handleChange} />
                    </div>
                </div>

                {/* Sección: Institución y Tarifa */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Institución</h3>
                    <div className={styles.inputGroup}>
                        <label>Institución</label>
                        <input required name="institution" value={formData.institution} onChange={handleChange} placeholder="Ej: Universidad Complutense de Madrid" />
                        <p className={styles.hint}>UCM: Tarifa A, Públicas/Fundaciones: B, Privadas: C</p>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Centro de Investigación / Facultad</label>
                        <input required name="center" value={formData.center} onChange={handleChange} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Tarifa Asignada</label>
                        <select name="tariff" value={formData.tariff} onChange={handleChange} className={styles.select}>
                            <option value="">Seleccionar...</option>
                            <option value="A">Tarifa A (UCM)</option>
                            <option value="B">Tarifa B (Pública/Fundación)</option>
                            <option value="C">Tarifa C (Privada)</option>
                        </select>
                    </div>
                </div>

                {/* Sección: Direcciones */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Direcciones</h3>
                    <div className={styles.inputGroup}>
                        <label>Dirección Fiscal</label>
                        <input required name="fiscalAddress" value={formData.fiscalAddress} onChange={handleChange} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Dirección Envío Factura</label>
                        <input required name="shippingAddress" value={formData.shippingAddress} onChange={handleChange} />
                    </div>
                </div>

                {/* Sección: Facturación Electrónica */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Facturación Electrónica</h3>
                    <div className={styles.grid2}>
                        <div className={styles.inputGroup}>
                            <label>Oficina Contable</label>
                            <input name="billing.accountingOffice" value={formData.billingData.accountingOffice} onChange={handleChange} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Órgano Gestor</label>
                            <input name="billing.managementBody" value={formData.billingData.managementBody} onChange={handleChange} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Unidad Tramitadora</label>
                            <input name="billing.processingUnit" value={formData.billingData.processingUnit} onChange={handleChange} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Órgano Proponente</label>
                            <input name="billing.proposingBody" value={formData.billingData.proposingBody} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Sección: Usuarios Autorizados */}
                <div className={cn(styles.section, styles.fullWidth)}>
                    <h3 className={styles.sectionTitle}>Usuarios Autorizados</h3>
                    <textarea
                        name="authorizedUsers"
                        value={formData.authorizedUsers}
                        onChange={handleChange}
                        placeholder="Nombres separados por comas"
                        className={styles.textarea}
                    />
                </div>
            </div>

            <div className={styles.actions}>
                <button type="button" onClick={onCancel} className="btn-secondary">
                    Cancelar
                </button>
                <button type="submit" className="btn-primary flex items-center gap-2">
                    <Save size={18} />
                    Guardar Investigador
                </button>
            </div>
        </form>
    );
};

export default ResearcherForm;
