import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import ExcelImporter from './ExcelImporter';
import styles from './ResearcherModal.module.css';

const institutions = [
    'Universidad Complutense de Madrid',
    'Hospital Gregorio Marañón',
    'Hospital 12 de Octubre',
    'Centro Nacional de Biotecnología (CNB)',
    'Consejo Superior de Investigaciones Científicas (CSIC)',
    'Centro de Investigaciones Energéticas, Medioambientales y Tecnológicas (CIEMAT)',
    'Empresa Privada S.L.',
    'Fundación Jiménez Díaz',
    'Hospital La Paz'
];

const ResearcherForm = ({ onSubmit, onCancel, initialData }) => {
    console.log("DEBUG: FILE LOADED");
    const [formData, setFormData] = useState({
        fullName: '',
        institution: '',
        department: '', // New
        faculty: '', // New
        city: '', // New
        center: '',
        idNumber: '',
        email: '',
        phone: '',
        fax: '', // New
        fiscalAddress: '',
        invoiceAddress: '', // Renamed from shippingAddress
        billingData: {
            accountingOffice: '',
            managementBody: '',
            processingUnit: '',
            proposingBody: ''
        },
        tariff: '',

    });

    // Authorized Users State
    const [associates, setAssociates] = useState([]);
    const [newAssociate, setNewAssociate] = useState({ name: '', email: '' });

    // Load initial data
    useEffect(() => {
        if (initialData) {
            // Flatten billing data if it came nested from API (it doesn't, it comes flat from DB usually)
            // But my API returns flat object. So I need to map it to structure.
            const {
                accountingOffice, managementBody, processingUnit, proposingBody,
                shippingAddress, // handle legacy if exists
                ...rest
            } = initialData;

            setFormData({
                ...rest,
                invoiceAddress: initialData.invoiceAddress || shippingAddress || '',
                billingData: {
                    accountingOffice: accountingOffice || '',
                    managementBody: managementBody || '',
                    processingUnit: processingUnit || '',
                    proposingBody: proposingBody || ''
                }
            });

            // Fetch associates
            fetch(`/api/researchers/${initialData.id}/associates`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
                .then(res => res.json())
                .then(data => setAssociates(data))
                .catch(err => console.error("Error loading associates:", err));
        }
    }, [initialData]);

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
        // Flatten for API
        const payload = {
            ...formData,
            ...formData.billingData
        };
        if (!initialData) {
            payload.associates = associates;
        }
        delete payload.billingData;
        onSubmit(payload);
    };

    // Auto-add Principal Researcher as first associate in Create Mode
    useEffect(() => {
        if (!initialData) {
            setAssociates(prev => {
                const principal = {
                    name: formData.fullName,
                    email: formData.email,
                    isPrincipal: true // Flag to identify auto-generated entry
                };

                // If list is empty, add principal
                if (prev.length === 0) return [principal];

                // If first item is the auto-generated principal, update it
                if (prev[0].isPrincipal) {
                    return [principal, ...prev.slice(1)];
                }

                // Otherwise (shouldn't happen in this logic flow typically), prepend
                return [principal, ...prev];
            });
        }
    }, [formData.fullName, formData.email, initialData]);

    const handleAddAssociate = async (e) => {
        e.preventDefault();

        if (!newAssociate.name) return;

        // EDIT MODE: Instant API Call
        if (initialData?.id) {
            try {
                const res = await fetch(`/api/researchers/${initialData.id}/associates`, { // Fixed URL
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}` // Ensure auth
                    },
                    body: JSON.stringify(newAssociate)
                });
                if (res.ok) {
                    const saved = await res.json();
                    setAssociates(prev => [...prev, saved]);
                    setNewAssociate({ name: '', email: '' });
                }
            } catch (error) {
                console.error("Error adding associate:", error);
            }
        }
        // CREATE MODE: Local State Only
        else {
            setAssociates(prev => [...prev, { ...newAssociate, id: Date.now() }]); // Temp ID
            setNewAssociate({ name: '', email: '' });
        }
    };

    const handleRemoveAssociate = async (id, isLocal) => {
        if (initialData?.id && !isLocal) {
            // API Delete for existing
            try {
                const res = await fetch(`/api/associates/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (res.ok) {
                    setAssociates(prev => prev.filter(a => a.id !== id));
                }
            } catch (e) { console.error(e); }
        } else {
            // Local Delete
            setAssociates(prev => prev.filter(a => a.id !== id));
        }
    };

    return (
        <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.grid}>
                    {/* Sección: Datos Personales */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Datos Personales</h3>
                        <div className={styles.inputGroup}>
                            <label htmlFor="researcher-fullName">Nombre y Apellidos</label>
                            <input id="researcher-fullName" required name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Ej: Juan Pérez" />
                        </div>
                        <div className={styles.row}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="researcher-email">Email</label>
                                <input id="researcher-email" required type="email" name="email" value={formData.email} onChange={handleChange} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="researcher-phone">Teléfono</label>
                                <input id="researcher-phone" required name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="researcher-fax">FAX</label>
                                <input id="researcher-fax" name="fax" value={formData.fax} onChange={handleChange} />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="researcher-idNumber">CIF / NIF</label>
                            <input id="researcher-idNumber" required name="idNumber" value={formData.idNumber} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Sección: Ubicación y Tarifa */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Institución y Ubicación</h3>

                        {/* Field 'institution' hidden/removed from UI, using 'center' as primary */}

                        {/* Centro de Investigación */}
                        <div className={styles.inputGroup}>
                            <label htmlFor="researcher-center">Centro de Investigación / Institución</label>
                            <input
                                id="researcher-center"
                                required
                                name="center"
                                value={formData.center || ''}
                                onChange={handleChange}
                                placeholder="Ej: Facultad de Medicina UCM"
                            />
                        </div>
                        <div className={styles.row}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="researcher-department">Departamento</label>
                                <input id="researcher-department" name="department" value={formData.department} onChange={handleChange} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="researcher-faculty">Facultad</label>
                                <input id="researcher-faculty" name="faculty" value={formData.faculty} onChange={handleChange} />
                            </div>
                        </div>
                        <div className={styles.row}>
                            {/* Center moved up */}
                            <div className={styles.inputGroup}>
                                <label htmlFor="researcher-city">Ciudad</label>
                                <input id="researcher-city" name="city" value={formData.city} onChange={handleChange} />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="researcher-tariff">Tarifa Asignada</label>
                            <select id="researcher-tariff" name="tariff" value={formData.tariff} onChange={handleChange} className={styles.select}>
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
                            <label htmlFor="researcher-fiscalAddress">Dirección Fiscal</label>
                            <input id="researcher-fiscalAddress" name="fiscalAddress" value={formData.fiscalAddress} onChange={handleChange} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="researcher-invoiceAddress">Dirección Envío Factura</label>
                            <input id="researcher-invoiceAddress" name="invoiceAddress" value={formData.invoiceAddress} onChange={handleChange} />
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

            {/* Sección: Usuarios Autorizados */}
            <div className={cn(styles.section, "mt-8 pt-8 border-t border-slate-700")}>
                <h3 className={styles.sectionTitle}>Usuarios Autorizados</h3>
                <p className="text-sm text-slate-400 mb-4">Personas autorizadas para solicitar servicios en nombre de este investigador.</p>

                <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                    <ul className="space-y-2 mb-4">
                        {associates.map(assoc => (
                            <li key={assoc.id || assoc.email} className="flex justify-between items-center text-sm bg-slate-900/50 p-2 rounded border border-slate-700">
                                <span>
                                    {assoc.name} <span className="text-slate-500">({assoc.email})</span>
                                    {assoc.isPrincipal && <span className="ml-2 text-xs bg-indigo-900 text-indigo-200 px-1 rounded">Principal</span>}
                                </span>
                                {!assoc.isPrincipal && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAssociate(assoc.id, !initialData)}
                                        className="text-red-400 hover:text-red-300"
                                        title="Eliminar"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </li>
                        ))}
                        {associates.length === 0 && <li className="text-slate-500 italic">No hay usuarios autorizados.</li>}
                    </ul>

                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <input
                                placeholder="Nombre completo"
                                value={newAssociate.name}
                                onChange={e => setNewAssociate({ ...newAssociate, name: e.target.value })}
                                className={styles.input}
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                placeholder="Email"
                                value={newAssociate.email}
                                onChange={e => setNewAssociate({ ...newAssociate, email: e.target.value })}
                                className={styles.input}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAddAssociate}
                            disabled={!newAssociate.name}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm transition-colors"
                        >
                            Añadir
                        </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-xs text-slate-400 mb-2">O importar masivamente desde Excel:</p>
                        <ExcelImporter
                            type="Usuarios Autorizados"
                            templateHeaders={['Nombre', 'Email']}
                            onImport={async (data) => {
                                let count = 0;
                                for (const row of data) {
                                    if (row.Nombre) {
                                        try {
                                            const res = await fetch(`/api/researchers/${initialData.id}/associates`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    name: row.Nombre,
                                                    email: row.Email || ''
                                                })
                                            });
                                            if (res.ok) {
                                                const saved = await res.json();
                                                setAssociates(prev => [...prev, saved]);
                                                count++;
                                            }
                                        } catch (e) {
                                            console.error("Import error specific row", e);
                                        }
                                    }
                                }
                                console.log(`Imported ${count} associates`);
                            }}
                        />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ResearcherForm;
