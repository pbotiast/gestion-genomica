import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import ExcelImporter from '../components/ExcelImporter';
import DataTable from '../components/DataTable';
import { Users, Link as LinkIcon, FilePenLine, Trash2, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';
import styles from './Associates.module.css';

const Associates = () => {
    const { researchers, associates, addAssociate, deleteAssociate, updateAssociate } = useAppContext();
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '' });
    const [globalFilter, setGlobalFilter] = useState('');

    // Enrich associates with researcher name
    const enrichedAssociates = useMemo(() => {
        return associates.map(link => {
            const researcher = researchers.find(r => r.id === link.researcherId);
            return {
                ...link,
                researcherName: researcher?.fullName || 'Sin asignar',
                researcherEmail: researcher?.email || ''
            };
        });
    }, [associates, researchers]);

    const handleAddLink = async () => {
        const rSelect = document.getElementById('link-researcher');
        const aInput = document.getElementById('link-associate');
        const emailInput = document.getElementById('link-email');
        const researcherId = rSelect.value;
        const associateName = aInput.value;
        const email = emailInput.value;

        if (researcherId && associateName) {
            try {
                await addAssociate(researcherId, { name: associateName, email });
                alert('Vinculación añadida correctamente');
                aInput.value = '';
                emailInput.value = '';
            } catch (e) {
                alert('Error al añadir');
            }
        } else {
            alert('Seleccione investigador y nombre de usuario');
        }
    };

    const handleEdit = (associate) => {
        setEditingId(associate.id);
        setEditForm({ name: associate.name, email: associate.email || '' });
    };

    const handleSaveEdit = async () => {
        if (editingId) {
            await updateAssociate(editingId, editForm);
            setEditingId(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: '', email: '' });
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
            cell: ({ row, getValue }) => {
                const isEditing = editingId === row.original.id;
                return isEditing ? (
                    <input
                        className="border rounded px-2 py-1 w-full text-sm"
                        value={editForm.name}
                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                ) : (
                    <span className="font-medium text-slate-900">{getValue()}</span>
                );
            },
        },
        {
            accessorKey: 'researcherName',
            header: 'Investigador Principal',
            cell: ({ getValue }) => (
                <span className="text-slate-700">{getValue()}</span>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row, getValue }) => {
                const isEditing = editingId === row.original.id;
                return isEditing ? (
                    <input
                        className="border rounded px-2 py-1 w-full text-sm"
                        value={editForm.email}
                        onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                ) : (
                    <span className="text-slate-600">{getValue() || '-'}</span>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => {
                const associate = row.original;
                const isEditing = editingId === associate.id;

                return (
                    <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSaveEdit}
                                    className="btn-icon-sm text-emerald-600 hover:text-emerald-800"
                                    title="Guardar"
                                >
                                    <Save size={16} />
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="btn-icon-sm text-slate-500 hover:text-slate-700"
                                    title="Cancelar"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleEdit(associate)}
                                    className="btn-icon-sm text-blue-600 hover:text-blue-800"
                                    title="Editar"
                                >
                                    <FilePenLine size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(associate.id)}
                                    className="btn-icon-sm text-red-600 hover:text-red-800"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                );
            },
        },
    ], [editingId, editForm]);

    return (
        <div className="space-y-6 fade-in">
            <header className={styles.header}>
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Usuarios Autorizados</h1>
                    <p className={styles.subtitle}>Gestión de vinculaciones entre Investigadores y Usuarios</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {/* Manual Management */}
                <div className="glass-panel p-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <LinkIcon size={20} className="text-emerald-600" />
                        Gestión Manual
                    </h2>

                    {/* Add Form */}
                    <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
                        <h3 className="text-sm font-medium text-slate-700 mb-2">Añadir Nueva Vinculación</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Investigador Principal</label>
                                <select id="link-researcher" className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900">
                                    <option value="">Seleccionar...</option>
                                    {researchers.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Usuario Autorizado (Apellidos, Nombre)</label>
                                <input id="link-associate" placeholder="Ej: Perez, Juan" className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Email (Opcional)</label>
                                <input id="link-email" type="email" placeholder="usuario@ucm.es" className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900" />
                            </div>
                            <button onClick={handleAddLink} className="btn-primary">Añadir</button>
                        </div>
                    </div>

                    {/* DataTable */}
                    <DataTable
                        columns={columns}
                        data={enrichedAssociates}
                        globalFilter={globalFilter}
                        onGlobalFilterChange={setGlobalFilter}
                        pageSize={15}
                        emptyMessage="No hay usuarios autorizados registrados."
                    />
                </div>

                {/* Bulk Import */}
                <div className="glass-panel p-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-blue-600" />
                        Importación Masiva
                    </h2>
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
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Associates;
