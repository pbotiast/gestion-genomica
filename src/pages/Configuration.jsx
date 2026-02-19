import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ExcelImporter from '../components/ExcelImporter';
import { api } from '../lib/api';
import Modal from '../components/Modal';
import { Settings as SettingsIcon, Database, Users, Building, Trash2, FilePenLine, Plus, Save, X, Upload } from 'lucide-react';

const Configuration = () => {
    const { addTechnician, technicians, deleteTechnician, updateTechnician, formats, addFormat, deleteFormat, updateFormat } = useAppContext();

    // Modals State
    const [activeModal, setActiveModal] = useState(null); // 'ADD_TECH', 'IMPORT_TECH', 'ADD_FORMAT', 'IMPORT_INST'
    const [inputValue, setInputValue] = useState('');

    // Editing State (Keep inline for simple name edits, or move to modal if strictly requested. Inline is better for lists)
    const [editingTech, setEditingTech] = useState(null);
    const [techNameEdit, setTechNameEdit] = useState('');
    const [editingFormat, setEditingFormat] = useState(null);
    const [formatNameEdit, setFormatNameEdit] = useState('');

    const addInstitution = async (name) => {
        try {
            await api.post('/institutions', { name });
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        if (activeModal === 'ADD_TECH') {
            await addTechnician(inputValue);
        } else if (activeModal === 'ADD_FORMAT') {
            await addFormat(inputValue);
        }

        setInputValue('');
        setActiveModal(null);
    };

    const closeModal = () => {
        setActiveModal(null);
        setInputValue('');
    };

    return (
        <div className="space-y-6 fade-in">
            <header>
                <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
                    <SettingsIcon size={32} />
                    Configuración
                </h1>
                <p className="text-slate-400">Gestión de datos maestros e importaciones</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Technicians Panel */}
                <div className="glass-panel p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                                <Users size={20} className="text-blue-400" />
                                Técnicos
                            </h2>
                            <p className="text-slate-400 text-sm">Personal habilitado</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveModal('IMPORT_TECH')}
                                className="btn-icon-sm text-slate-400 hover:text-blue-400"
                                title="Importar"
                            >
                                <Upload size={18} />
                            </button>
                            <button
                                onClick={() => setActiveModal('ADD_TECH')}
                                className="btn-icon-sm text-slate-400 hover:text-emerald-400"
                                title="Añadir"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden bg-slate-900/30 rounded-lg p-2 border border-slate-700/50">
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {technicians.length === 0 && <p className="text-slate-500 text-sm p-2">No hay técnicos registrados.</p>}
                            {technicians.map((tech, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-slate-700/30 rounded border border-slate-700 group hover:border-slate-500 transition-colors">
                                    {editingTech === tech ? (
                                        <div className="flex gap-2 flex-1">
                                            <input
                                                value={techNameEdit}
                                                onChange={(e) => setTechNameEdit(e.target.value)}
                                                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white w-full outline-none focus:border-blue-500"
                                                autoFocus
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
                </div>

                {/* Formats Panel */}
                <div className="glass-panel p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                                <Database size={20} className="text-amber-400" />
                                Formatos
                            </h2>
                            <p className="text-slate-400 text-sm">Tipos de muestras</p>
                        </div>
                        <button
                            onClick={() => setActiveModal('ADD_FORMAT')}
                            className="btn-icon-sm text-slate-400 hover:text-emerald-400"
                            title="Añadir"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden bg-slate-900/30 rounded-lg p-2 border border-slate-700/50">
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {formats.length === 0 && <p className="text-slate-500 text-sm p-2">No hay formatos registrados.</p>}
                            {formats.map((fmt, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-slate-700/30 rounded border border-slate-700 group hover:border-slate-500 transition-colors">
                                    {editingFormat === fmt ? (
                                        <div className="flex gap-2 flex-1">
                                            <input
                                                value={formatNameEdit}
                                                onChange={(e) => setFormatNameEdit(e.target.value)}
                                                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white w-full outline-none focus:border-amber-500"
                                                autoFocus
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
                </div>

                {/* Institutions Import (Standalone) */}
                <div className="glass-panel p-6 flex flex-col items-center justify-center text-center">
                    <div className="bg-purple-500/10 p-4 rounded-full mb-4">
                        <Building size={32} className="text-purple-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-200 mb-2">Instituciones</h2>
                    <p className="text-slate-400 text-sm mb-6 max-w-xs">
                        Importar catálogo maestro de instituciones desde archivo Excel.
                    </p>
                    <button
                        onClick={() => setActiveModal('IMPORT_INST')}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Upload size={18} />
                        Importar Catálogo
                    </button>
                </div>
            </div>

            {/* Modals */}
            <Modal
                isOpen={!!activeModal}
                onClose={closeModal}
                title={
                    activeModal === 'ADD_TECH' ? 'Añadir Técnico' :
                        activeModal === 'ADD_FORMAT' ? 'Añadir Formato' :
                            activeModal === 'IMPORT_TECH' ? 'Importar Técnicos' :
                                'Importar Instituciones'
                }
            >
                {/* Add Technician / Format Form */}
                {(activeModal === 'ADD_TECH' || activeModal === 'ADD_FORMAT') && (
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">
                                Nombre {activeModal === 'ADD_TECH' ? 'del Técnico' : 'del Formato'}
                            </label>
                            <input
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder={activeModal === 'ADD_TECH' ? "Ej: Juan García" : "Ej: Placa 96"}
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
                            <button type="submit" className="btn-primary">Añadir</button>
                        </div>
                    </form>
                )}

                {/* Import Technicians */}
                {activeModal === 'IMPORT_TECH' && (
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
                            alert(`Importados ${count} técnicos.`);
                            closeModal();
                        }}
                    />
                )}

                {/* Import Institutions */}
                {activeModal === 'IMPORT_INST' && (
                    <ExcelImporter
                        type="Instituciones"
                        templateHeaders={['Nombre']}
                        onImport={async (data) => {
                            const mapped = data.map(row => row['Nombre'] || row['nombre']).filter(n => n);
                            let count = 0;
                            for (const name of mapped) {
                                await addInstitution(name);
                                count++;
                            }
                            alert(`Importadas ${count} instituciones.`);
                            closeModal();
                        }}
                    />
                )}
            </Modal>
        </div>
    );
};

export default Configuration;
