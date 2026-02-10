import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import ExcelImporter from '../components/ExcelImporter';
import { Settings as SettingsIcon, Database, Users, Building } from 'lucide-react';

const Configuration = () => {
    const { addTechnician } = useAppContext();
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
                    <ExcelImporter
                        type="Técnicos"
                        templateHeaders={['Nombre']}
                        onImport={async (data) => {
                            const mapped = data.map(row => row['Nombre'] || row['nombre']).filter(n => n);
                            for (const name of mapped) {
                                await addTechnician(name);
                            }
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
