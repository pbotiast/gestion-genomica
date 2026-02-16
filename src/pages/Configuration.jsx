import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ExcelImporter from '../components/ExcelImporter';
import { Settings as SettingsIcon, Database, Users, Building, Trash2, FilePenLine, Plus, Save, X } from 'lucide-react';

const Configuration = () => {
    const { addTechnician, technicians, deleteTechnician, updateTechnician, formats, addFormat, deleteFormat, updateFormat } = useAppContext();
    const [editingTech, setEditingTech] = useState(null);
    const [techNameEdit, setTechNameEdit] = useState('');

    // Formats state
    const [editingFormat, setEditingFormat] = useState(null);
    const [formatNameEdit, setFormatNameEdit] = useState('');

    const addInstitution = async (name) => {
        // We'll need to expose this in AppContext later if we want full Institution management
        // For now, let's just use the API directly here for the importer
        try {
            await fetch('http://localhost:3000/api/institutions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
                    <SettingsIcon size={32} />
                    Configuración
                </h1>
                <p className="text-slate-400">Gestión de datos maestros e importaciones</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Technicians Import */}
                <div className="glass-panel p-6">
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-blue-400" />
                        Técnicos
                    </h2>
                    <p className="text-slate-400 mb-4 text-sm">
                        Importar lista de técnicos habilitados.
                    </p>
                    <div className="mb-4 flex gap-2">
                        <input
                            placeholder="Nombre del técnico"
                            className="input flex-1"
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter' && e.target.value) {
                                    await addTechnician(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                        />
                        <button
                            className="btn-primary"
                            onClick={async (e) => {
                                const input = e.target.previousElementSibling;
                                if (input.value) {
                                    await addTechnician(input.value);
                                    input.value = '';
                                }
                            }}
                        >
                            Añadir
                        </button>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">Lista Actual:</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {technicians.map((tech, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-slate-700/30 rounded border border-slate-700 group hover:border-slate-500 transition-colors">
                                    {editingTech === tech ? (
                                        <div className="flex gap-2 flex-1">
                                            <input
                                                value={techNameEdit}
                                                onChange={(e) => setTechNameEdit(e.target.value)}
                                                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white w-full"
                                            />
                                            <button onClick={() => {
                                                if (techNameEdit && techNameEdit !== tech) updateTechnician(tech, techNameEdit);
                                                setEditingTech(null);
                                            }} className="text-emerald-400 hover:text-emerald-300"><Save size={16} /></button>
                                            <button onClick={() => setEditingTech(null)} className="text-slate-400 hover:text-slate-300"><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-slate-200 text-sm font-medium">{tech}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => {
                                                    setEditingTech(tech);
                                                    setTechNameEdit(tech);
                                                }} className="p-1 text-blue-400 hover:bg-blue-500/10 rounded"><FilePenLine size={14} /></button>
                                                <button onClick={() => deleteTechnician(tech)} className="p-1 text-rose-400 hover:bg-rose-500/10 rounded"><Trash2 size={14} /></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-slate-400 mb-4 text-sm border-t border-slate-700 pt-4">
                        O importar lista de técnicos habilitados (Excel):
                    </p>
                    <ExcelImporter
                        type="Técnicos"
                        templateHeaders={['Nombre']}
                        onImport={async (data) => {
                            const mapped = data.map(row => row['Nombre'] || row['nombre']).filter(n => n);
                            let count = 0;
                            for (const name of mapped) {
                                await addTechnician(name);
                                count++;
                            }
                            console.log(`Imported ${count} technicians`);
                        }}
                    />
                </div>

                <div className="glass-panel p-6 pb-2">
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <Database size={20} className="text-amber-400" />
                        Formatos de Entrada
                    </h2>
                    <p className="text-slate-400 mb-4 text-sm">
                        Gestionar formatos de muestras disponibles (Tubos, Placas, etc.)
                    </p>

                    <div className="mb-4 flex gap-2">
                        <input
                            placeholder="Nuevo formato (ej. Placa 384)"
                            className="input flex-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value) {
                                    addFormat(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                        />
                        <button
                            className="btn-primary"
                            onClick={(e) => {
                                const input = e.target.previousElementSibling;
                                if (input.value) {
                                    addFormat(input.value);
                                    input.value = '';
                                }
                            }}
                        >
                            Añadir
                        </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 mb-4">
                        {formats.map((fmt, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-slate-700/30 rounded border border-slate-700 group hover:border-slate-500 transition-colors">
                                {editingFormat === fmt ? (
                                    <div className="flex gap-2 flex-1">
                                        <input
                                            value={formatNameEdit}
                                            onChange={(e) => setFormatNameEdit(e.target.value)}
                                            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white w-full"
                                        />
                                        <button onClick={() => {
                                            if (formatNameEdit && formatNameEdit !== fmt) updateFormat(fmt, formatNameEdit);
                                            setEditingFormat(null);
                                        }} className="text-emerald-400 hover:text-emerald-300"><Save size={16} /></button>
                                        <button onClick={() => setEditingFormat(null)} className="text-slate-400 hover:text-slate-300"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-slate-200 text-sm font-medium">{fmt}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => {
                                                setEditingFormat(fmt);
                                                setFormatNameEdit(fmt);
                                            }} className="p-1 text-blue-400 hover:bg-blue-500/10 rounded"><FilePenLine size={14} /></button>
                                            <button onClick={() => deleteFormat(fmt)} className="p-1 text-rose-400 hover:bg-rose-500/10 rounded"><Trash2 size={14} /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Institutions Import */}
                <div className="glass-panel p-6">
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <Building size={20} className="text-purple-400" />
                        Instituciones
                    </h2>
                    <p className="text-slate-400 mb-4 text-sm">
                        Importar catálogo de instituciones.
                    </p>
                    <ExcelImporter
                        type="Instituciones"
                        templateHeaders={['Nombre']}
                        onImport={async (data) => {
                            const mapped = data.map(row => row['Nombre'] || row['nombre']).filter(n => n);
                            for (const name of mapped) {
                                await addInstitution(name);
                            }
                        }}
                    />
                </div>

            </div>
        </div>
    );
};

export default Configuration;
