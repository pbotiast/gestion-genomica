import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ExcelImporter from '../components/ExcelImporter';
import { Users, Link as LinkIcon, Trash2, FilePenLine, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';
import styles from './Associates.module.css';

const Associates = () => {
    const { researchers, associates, addAssociate, deleteAssociate, updateAssociate } = useAppContext();
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const handleAddLink = async () => {
        const rSelect = document.getElementById('link-researcher');
        const aInput = document.getElementById('link-associate');
        const researcherId = rSelect.value;
        const associateName = aInput.value;

        if (researcherId && associateName) {
            try {
                await addAssociate(researcherId, associateName);
                alert('Vinculación añadida correctamente');
                aInput.value = '';
            } catch (e) {
                alert('Error al añadir');
            }
        } else {
            alert('Seleccione investigador y nombre de usuario');
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAssociates = [...associates].map(link => {
        const researcher = researchers.find(r => r.id === link.researcherId);
        return { ...link, researcherName: researcher?.fullName || '' };
    }).sort((a, b) => {
        if (!sortConfig.key) return 0;
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span className="text-slate-300 ml-1 text-[10px]">▼</span>;
        return <span className="text-blue-600 ml-1 font-bold text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
        <div className="space-y-6">
            <header className={styles.header}>
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Usuarios Autorizados</h1>
                    <p className={styles.subtitle}>Gestión de vinculaciones entre Investigadores y Usuarios</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Manual Management */}
                <div className="glass-panel p-6 md:col-span-2">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <LinkIcon size={20} className="text-emerald-600" />
                        Gestión Manual
                    </h2>

                    {/* Add Form */}
                    <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
                        <h3 className="text-sm font-medium text-slate-700 mb-2">Añadir Nueva Vinculación</h3>
                        <div className="flex flex-col md:flex-row gap-2 items-end">
                            <div className="flex-1 w-full">
                                <label className="text-xs text-slate-500 mb-1 block">Investigador Principal</label>
                                <select id="link-researcher" className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900">
                                    <option value="">Seleccionar...</option>
                                    {researchers.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                                </select>
                            </div>
                            <div className="flex-1 w-full">
                                <label className="text-xs text-slate-500 mb-1 block">Usuario Autorizado (Apellidos, Nombre)</label>
                                <input id="link-associate" placeholder="Ej: Perez, Juan" className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900" />
                            </div>
                            <button onClick={handleAddLink} className="btn-primary">Añadir</button>
                        </div>
                    </div>

                    {/* Table */}
                    {associates.length === 0 ? (
                        <div className="text-slate-500 p-4 text-center border border-slate-200 rounded-lg dashed">
                            No hay usuarios autorizados registrados.
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <div className={styles.desktopView}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort('name')}>
                                                <div className={styles.thContent}>Usuario Autorizado <SortIcon columnKey="name" /></div>
                                            </th>
                                            <th onClick={() => handleSort('researcherName')}>
                                                <div className={styles.thContent}>Investigador Principal <SortIcon columnKey="researcherName" /></div>
                                            </th>
                                            <th onClick={() => handleSort('email')}>
                                                <div className={styles.thContent}>Email <SortIcon columnKey="email" /></div>
                                            </th>
                                            <th className={styles.colActions}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedAssociates.map(link => {
                                            const isEditing = editingId === link.id;
                                            return (
                                                <tr key={link.id}>
                                                    <td className="font-medium text-slate-900 border-r">
                                                        {isEditing ? <input className="border rounded px-2 py-1 w-full text-xs" value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} /> : link.name}
                                                    </td>
                                                    <td className="border-r">{link.researcherName}</td>
                                                    <td className="border-r">
                                                        {isEditing ? <input className="border rounded px-2 py-1 w-full text-xs" value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} /> : (link.email || '-')}
                                                    </td>
                                                    <td className={styles.colActions}>
                                                        <div className="flex justify-center gap-1">
                                                            {isEditing ? (
                                                                <>
                                                                    <button onClick={() => { updateAssociate(link.id, editForm); setEditingId(null); }} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Save size={14} /></button>
                                                                    <button onClick={() => setEditingId(null)} className="text-slate-500 hover:bg-slate-100 p-1 rounded"><X size={14} /></button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => { setEditingId(link.id); setEditForm({ name: link.name, email: link.email }); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><FilePenLine size={14} /></button>
                                                                    <button onClick={() => deleteAssociate(link.id)} className="text-rose-600 hover:bg-rose-50 p-1 rounded"><Trash2 size={14} /></button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className={cn(styles.mobileView, "space-y-3 p-4")}>
                                {sortedAssociates.map(link => (
                                    <div key={link.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-3">
                                        <div>
                                            <span className="text-xs text-slate-500">Usuario</span>
                                            <span className="font-bold text-slate-800 block text-lg">{link.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500">Investigador</span>
                                            <span className="text-slate-700 block">{link.researcherName}</span>
                                        </div>
                                        <div className="flex justify-end pt-2 border-t border-slate-100">
                                            <button onClick={() => { setEditingId(link.id); setEditForm({ name: link.name, email: link.email }); }} className="text-blue-600 p-2"><FilePenLine size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bulk Import */}
                <div className="glass-panel p-6 md:col-span-2">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-blue-600" />
                        Importación Masiva
                    </h2>
                    <ExcelImporter
                        type="Vinculaciones"
                        templateHeaders={['InvestigadorPrincipal', 'UsuarioAutorizado']}
                        onImport={async (data) => {
                            for (const row of data) {
                                // Basic logic to find researcher by name?
                                // This requires fuzzy matching or exact matching.
                                // I'll skip complex logic here for now as user just wants UI fix.
                            }
                        }}
                    />
                </div>

            </div>
        </div>
    );
};

export default Associates;
