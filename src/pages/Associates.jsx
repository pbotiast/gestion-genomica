import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import ExcelImporter from '../components/ExcelImporter';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Users, Link as LinkIcon, FilePenLine, Trash2, Save, X, Plus, Upload } from 'lucide-react';
import { cn } from '../lib/utils';
import styles from './Associates.module.css';

const Associates = () => {
    const { researchers, associates, addAssociate, deleteAssociate, updateAssociate } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ researcherId: '', name: '', email: '' });
    const [globalFilter, setGlobalFilter] = useState('');

    // Enrich associates with researcher name
    const enrichedAssociates = useMemo(() => {
        return associates.map(link => {
            const researcher = researchers.find(r => r.id == link.researcherId);
            return {
                ...link,
                researcherName: researcher?.fullName || 'Sin asignar',
                researcherEmail: researcher?.email || ''
            };
        });
    }, [associates, researchers]);

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({ researcherId: '', name: '', email: '' });
        setIsFormModalOpen(true);
    };

    const handleEdit = (associate) => {
        setEditingId(associate.id);
        const researcher = researchers.find(r => r.id == associate.researcherId);
        setFormData({
            researcherId: researcher?.id || '',
            name: associate.name,
            email: associate.email || ''
        });
        setIsFormModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.researcherId || !formData.name) {
            alert('Seleccione investigador y nombre de usuario');
            return;
        }

        try {
            if (editingId) {
                await updateAssociate(editingId, formData);
            } else {
                await addAssociate(formData.researcherId, { name: formData.name, email: formData.email });
            }
            setIsFormModalOpen(false);
            setEditingId(null);
            setFormData({ researcherId: '', name: '', email: '' });
        } catch (e) {
            console.error(e);
            alert('Error al guardar');
        }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Eliminar esta vinculación?')) {
            await deleteAssociate(id);
        }
    };

    // Define columns for DataTable
    const columns = useMemo(() => [
        {
            accessorKey: 'name',
            header: 'Usuario Autorizado',
            cell: ({ getValue }) => <span className="font-medium text-slate-900">{getValue()}</span>,
        },
        {
            accessorKey: 'researcherName',
            header: 'Investigador Principal',
            cell: ({ getValue }) => <span className="text-slate-700">{getValue()}</span>,
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ getValue }) => <span className="text-slate-600">{getValue() || '-'}</span>,
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleEdit(row.original)}
                        className="btn-icon-sm text-blue-600 hover:text-blue-800"
                        title="Editar"
                    >
                        <FilePenLine size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.original.id)}
                        className="btn-icon-sm text-red-600 hover:text-red-800"
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ], []);

    return (
        <div className="space-y-6 fade-in">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Usuarios Autorizados</h1>
                    <p className={styles.subtitle}>Gestión de vinculaciones entre Investigadores y Usuarios</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary flex items-center gap-2">
                        <Upload size={20} />
                        Importar
                    </button>
                    <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
                        <Plus size={20} />
                        Nueva Vinculación
                    </button>
                </div>
            </header>

            {/* DataTable - Full Width and Clean */}
            <div className="glass-panel p-6">
                <DataTable
                    columns={columns}
                    data={enrichedAssociates}
                    globalFilter={globalFilter}
                    onGlobalFilterChange={setGlobalFilter}
                    pageSize={15}
                    emptyMessage="No hay usuarios autorizados registrados."
                />
            </div>

            {/* Modal: Form */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingId ? "Editar Vinculación" : "Nueva Vinculación"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Investigador Principal</label>
                        <select
                            value={formData.researcherId}
                            onChange={e => setFormData(prev => ({ ...prev, researcherId: e.target.value }))}
                            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {researchers.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Usuario Autorizado (Nombre)</label>
                        <input
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ej: Perez, Juan"
                            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Email (Opcional)</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="usuario@ucm.es"
                            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={() => setIsFormModalOpen(false)} className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            {editingId ? "Guardar Cambios" : "Añadir Vinculación"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Import */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Importación Masiva de Usuarios"
            >
                <ExcelImporter
                    type="Vinculaciones"
                    templateHeaders={['InvestigadorPrincipal', 'UsuarioAutorizado', 'Email']}
                    onImport={async (data) => {
                        let addedCount = 0;
                        let errors = [];

                        for (const row of data) {
                            const researcherName = row['InvestigadorPrincipal'];
                            const associateName = row['UsuarioAutorizado'];
                            const email = row['Email'] || '';

                            if (!researcherName || !associateName) continue;

                            const researcher = researchers.find(r =>
                                r.fullName.toLowerCase() === researcherName.toLowerCase() ||
                                (r.fullName + " " + (r.institution || "")).toLowerCase().includes(researcherName.toLowerCase())
                            );

                            if (researcher) {
                                try {
                                    await addAssociate(researcher.id, { name: associateName, email });
                                    addedCount++;
                                } catch (e) {
                                    errors.push(`Error al añadir ${associateName}: ${e.message}`);
                                }
                            } else {
                                errors.push(`Investigador no encontrado: ${researcherName}`);
                            }
                        }

                        if (addedCount > 0) alert(`Se han importado ${addedCount} vinculaciones correctamente.`);
                        if (errors.length > 0) alert(`Errores:\n${errors.join('\n')}`);
                        setIsImportModalOpen(false);
                    }}
                />
            </Modal>
        </div>
    );
};

export default Associates;
