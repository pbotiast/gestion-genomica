import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import ExcelImporter from '../components/ExcelImporter';
import { Settings as SettingsIcon, Database, Users, Building } from 'lucide-react';

const Configuration = () => {
    const { addTechnician, technicians } = useAppContext();
    const [status, setStatus] = useState('');

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
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                            {technicians.map((tech, i) => (
                                <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300 border border-slate-600">
                                    {tech}
                                </span>
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
