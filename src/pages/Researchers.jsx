import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import ResearcherForm from '../components/ResearcherForm';
import ExcelImporter from '../components/ExcelImporter';
import { cn } from '../lib/utils';
import styles from './Researchers.module.css';

const Researchers = () => {
    const { researchers, addResearcher, deleteResearcher, updateResearcher } = useAppContext();
    const [selectedResearcher, setSelectedResearcher] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateOrUpdate = async (data) => {
        if (selectedResearcher) {
            await updateResearcher(selectedResearcher.id, data);
        } else {
            await addResearcher(data);
        }
        setIsModalOpen(false);
        setSelectedResearcher(null);
    };

    const openEditModal = (researcher) => {
        setSelectedResearcher(researcher);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedResearcher(null);
        setIsModalOpen(true);
    };

    return (
        <div>
            {/* ... header ... */}
            <div className={styles.header}>
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Investigadores</h1>
                    <p className={styles.subtitle}>Gestión de usuarios y tarifas</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    Nuevo Investigador
                </button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} className="text-slate-500" />
                    <input
                        placeholder="Buscar investigador..."
                        className={styles.searchInput}
                    />
                </div>
                <div className="flex-1"></div>
                <ExcelImporter
                    type="Investigadores"
                    templateHeaders={['InvestigadorPrincipal', 'Institucion', 'e-mail', 'Tarifa']}
                    onImport={async (data) => {
                        let count = 0;
                        for (const row of data) {
                            // Map specific Excel columns provided by user
                            // Format: InvestigadorPrincipal, Departamento, Institucion, Ciudad, Telefono, FAX, e-mail, CIF, ...

                            const fullName = row['InvestigadorPrincipal'] || row['Investigador'] || row['Nombre'];

                            if (!fullName) continue; // Skip empty rows

                            const researcherData = {
                                fullName: fullName,
                                department: row['Departamento'] || '',
                                institution: row['Institucion'] || row['Institución'] || '',
                                city: row['Ciudad'] || '',
                                phone: row['Telefono'] || row['Teléfono'] || '',
                                fax: row['FAX'] || row['Fax'] || '',
                                email: row['e-mail'] || row['Email'] || row['Correo'] || '',
                                idNumber: row['CIF'] || row['NIF'] || '',
                                fiscalAddress: row['Direccion Fiscal'] || row['Dirección Fiscal'] || '',
                                invoiceAddress: row['Direccion Factura'] || row['Dirección Factura'] || '',

                                // Billing Data (Flat in this object, backend/context might expect nested? 
                                // AppContext.addResearcher sends body directly. 
                                // Server expects flattened fields for INSERT.
                                // My ResearcherForm handles nesting for UI but flat for submit.
                                // Wait, ResearcherForm submits flat? 
                                // Let's check ResearcherForm.handleSubmit: 
                                // const payload = { ...formData, ...formData.billingData }; delete payload.billingData;
                                // Yes, it flattens. The server expects flat fields.
                                // So I can just send flat fields here.)
                                accountingOffice: row['Oficina Contable'] || '',
                                managementBody: row['Organo Gestor'] || row['Órgano Gestor'] || '',
                                processingUnit: row['Unidad Tramitadora'] || '',
                                proposingBody: row['Organo Proponente'] || row['Órgano Proponente'] || '',

                                tariff: row['Tarifa'] || 'C'
                            };

                            // Basic duplicate check or let backend handle?
                            // Backend doesn't seem to enforce unique name, maybe unique ID/Email?
                            // Let's just add.
                            await addResearcher(researcherData);
                            count++;
                        }
                        console.log(`Imported ${count} researchers`);
                    }}
                />
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Institución</th>
                            <th>Email</th>
                            <th>Departamento</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(researchers) && researchers.map(researcher => (
                            <tr key={researcher?.id || Math.random()}>
                                <td className="font-medium">{researcher?.fullName}</td>
                                <td>{researcher.institution}</td>
                                <td>{researcher.email}</td>
                                <td>{researcher.department}</td>
                                <td>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditModal(researcher)} className={styles.actionBtn} title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => deleteResearcher(researcher.id)} className={styles.actionBtn} title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* ... modal ... */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={cn("glass-panel", styles.modalContent)}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{selectedResearcher ? 'Editar Investigador' : 'Nuevo Investigador'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <ResearcherForm
                                onSubmit={handleCreateOrUpdate}
                                onCancel={() => setIsModalOpen(false)}
                                initialData={selectedResearcher}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Researchers;
