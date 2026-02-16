import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import styles from './ServiceForm.module.css'; // Reusing similar styles

const RequestForm = ({ onSubmit, onCancel, initialData }) => {
    const { researchers, services, technicians, requests, associates, formats } = useAppContext();

    // ID Generation Logic: YYYY-XXXXX (Only if not editing)
    const generateId = () => {
        const year = new Date().getFullYear();
        const count = requests.filter(r => r.registrationNumber && r.registrationNumber.startsWith(`${year}-`)).length;
        const nextNum = (count + 1).toString().padStart(5, '0');
        return `${year}-${nextNum}`;
    };

    const [formData, setFormData] = useState(initialData || {
        registrationNumber: generateId(),
        entryDate: new Date().toISOString().split('T')[0],
        researcherId: '',
        serviceId: '',
        samplesCount: '',
        format: '',
        finalSamplesCount: '',
        additionalInfo: '',
        requestedBy: '', // New field
        resultSentDate: '',
        technician: '',
        institution: '', // Auto-filled
        tariff: '' // Auto-filled
    });

    // Remove local associates state and useEffect fetch
    // const [associates, setAssociates] = useState([]);...

    // Auto-fill Institution, Tariff, and RequestedBy when Researcher changes
    useEffect(() => {
        if (formData.researcherId) {
            // Loose equality to handle string/number mismatch from select input
            const researcher = researchers.find(r => r.id == formData.researcherId);
            if (researcher) {
                setFormData(prev => ({
                    ...prev,
                    institution: researcher.center || researcher.institution,
                    tariff: researcher.tariff || 'C',
                    // Default requestedBy to researcher name if empty, or keep user input?
                    // Let's set it to researcher name as default, user can change.
                    requestedBy: prev.requestedBy || researcher.fullName
                }));
            }
        }
    }, [formData.researcherId, researchers]);

    // Auto-fill Format when Service changes
    useEffect(() => {
        if (formData.serviceId) {
            const service = services.find(s => s.id == formData.serviceId);
            if (service) {
                setFormData(prev => ({
                    ...prev,
                    format: service.format || ''
                }));
            }
        }
    }, [formData.serviceId, services]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Filter researchers based on selected associate
    const matchingAssociates = formData.requestedBy ? associates.filter(a => a.name.toLowerCase() === formData.requestedBy.toLowerCase()) : [];
    const filteredResearchers = matchingAssociates.length > 0
        ? researchers.filter(r => matchingAssociates.some(a => a.researcherId === r.id))
        : researchers;

    const handleAssociateChange = (e) => {
        const value = e.target.value;
        const matches = associates.filter(a => a.name === value);

        setFormData(prev => {
            const newData = { ...prev, requestedBy: value };

            if (matches.length === 1) {
                // Exact unique match - auto select
                newData.researcherId = matches[0].researcherId;
            } else if (matches.length > 1) {
                // Multiple matches - clear researcher to force selection from filtered list
                // Unless current researcher is one of the matches?
                const currentIsOneOfMatches = matches.some(m => m.researcherId === prev.researcherId);
                if (!currentIsOneOfMatches) {
                    newData.researcherId = '';
                }
            }
            return newData;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Find names for display
        // Use loose equality for safety
        const researcher = researchers.find(r => r.id == formData.researcherId);
        const service = services.find(s => s.id == formData.serviceId);

        onSubmit({
            ...formData,
            researcherName: researcher?.fullName,
            serviceName: service?.name,
            // Store calculated price snapshot?
            // Logic: Price per sample? User didn't specify calc, just "price associated".
            // Usually total = price * samples.
        });
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.section}>
                <div className={styles.grid3}>
                    <div className={styles.inputGroup}>
                        <label>Nº Registro</label>
                        <input readOnly name="registrationNumber" value={formData.registrationNumber} className="bg-slate-700/50 cursor-not-allowed" />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Fecha Entrada</label>
                        <input type="date" name="entryDate" value={formData.entryDate} onChange={handleChange} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Técnico Gestor</label>
                        <select name="technician" value={formData.technician} onChange={handleChange} className={styles.select}>
                            <option value="">Seleccionar...</option>
                            {technicians.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Datos del Investigador</h3>

                <div className={styles.inputGroup}>
                    <label>Solicitado por (Usuario Autorizado)</label>
                    <input
                        list="associates-list"
                        name="requestedBy"
                        value={formData.requestedBy}
                        onChange={handleAssociateChange}
                        placeholder="Empezar a escribir nombre..."
                    />
                    <datalist id="associates-list">
                        {/* Show unique names only in datalist */}
                        {[...new Set(associates.map(a => a.name))].map(name => (
                            <option key={name} value={name} />
                        ))}
                    </datalist>
                    {/* Helper text */}
                    {matchingAssociates.length === 1 && (
                        <p className="text-xs text-emerald-400 mt-1">
                            Vinculado a: {researchers.find(r => r.id === matchingAssociates[0].researcherId)?.fullName}
                        </p>
                    )}
                    {matchingAssociates.length > 1 && (
                        <p className="text-xs text-amber-400 mt-1">
                            Usuario vinculado a múltiples investigadores. Por favor seleccione uno abajo.
                        </p>
                    )}
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="researcherId">Investigador Principal</label>
                    <select id="researcherId" required name="researcherId" value={formData.researcherId} onChange={handleChange} className={styles.select}>
                        <option value="">Seleccionar Investigador...</option>
                        {filteredResearchers.map(r => (
                            <option key={r.id} value={r.id}>{r.fullName} - {r.institution}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.grid3}>
                    <div className={styles.inputGroup}>
                        <label>Institución</label>
                        <input readOnly name="institution" value={formData.institution} className="bg-slate-700/50" />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Tarifa Aplicable</label>
                        <input readOnly name="tariff" value={formData.tariff} className="bg-slate-700/50 text-emerald-400 font-bold" />
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Datos del Servicio</h3>
                <div className={styles.inputGroup}>
                    <label htmlFor="serviceId">Servicio Solicitado</label>
                    <select id="serviceId" required name="serviceId" value={formData.serviceId} onChange={handleChange} className={styles.select}>
                        <option value="">Seleccionar Servicio...</option>
                        {services.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.format})</option>
                        ))}
                    </select>
                </div>
                <div className={styles.grid3}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="samplesCount">Nº Muestras</label>
                        <input id="samplesCount" required type="number" name="samplesCount" value={formData.samplesCount} onChange={handleChange} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Formato</label>
                        <select name="format" value={formData.format} onChange={handleChange} className={styles.select}>
                            <option value="">Seleccionar Formato...</option>
                            {formats && formats.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Nº Muestras Finales</label>
                        <input name="finalSamplesCount" value={formData.finalSamplesCount} onChange={handleChange} />
                    </div>
                </div>
                <div className={styles.inputGroup}>
                    <label>Información Adicional</label>
                    <textarea name="additionalInfo" value={formData.additionalInfo} onChange={handleChange} className="min-h-[80px]" />
                </div>
            </div>

            <div className={styles.actions}>
                <button type="button" onClick={onCancel} className="btn-secondary">
                    Cancelar
                </button>
                <button type="submit" className="btn-primary flex items-center gap-2">
                    <Save size={18} />
                    Registrar Solicitud
                </button>
            </div>
        </form>
    );
};

export default RequestForm;
