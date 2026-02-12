import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import ExcelImporter from '../components/ExcelImporter';
import { Users, Link as LinkIcon, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

const Associates = () => {
    const { researchers } = useAppContext();
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLinks = () => {
        setLoading(true);
        fetch('http://localhost:3000/api/associates')
            .then(res => res.json())
            .then(data => {
                setLinks(data);
                setLoading(false);
            })
            .catch(e => setLoading(false));
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    const handleAddLink = async () => {
        const rSelect = document.getElementById('link-researcher');
        const aInput = document.getElementById('link-associate');
        const researcherId = rSelect.value;
        const associateName = aInput.value;

        if (researcherId && associateName) {
            try {
                const res = await fetch(`http://localhost:3000/api/researchers/${researcherId}/associates`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: associateName })
                });
                if (res.ok) {
                    alert('Vinculación añadida correctamente');
                    aInput.value = '';
                    fetchLinks(); // Refresh list
                }
            } catch (e) {
                console.error(e);
                alert('Error al añadir');
            }
        } else {
            alert('Seleccione investigador y nombre de usuario');
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
                    <Users size={32} />
                    Usuarios Autorizados
                </h1>
                <p className="text-slate-500">Gestión de vinculaciones entre Investigadores y Usuarios Autorizados</p>
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
                                <select
                                    id="link-researcher"
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900"
                                >
                                    <option value="">Seleccionar...</option>
                                    {researchers.map(r => (
                                        <option key={r.id} value={r.id}>{r.fullName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 w-full">
                                <label className="text-xs text-slate-500 mb-1 block">Usuario Autorizado (Apellidos, Nombre)</label>
                                <input
                                    id="link-associate"
                                    placeholder="Ej: Perez, Juan"
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-900"
                                />
                            </div>
                            <button onClick={handleAddLink} className="btn-primary">
                                Añadir
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-slate-500">Cargando vinculaciones...</div>
                    ) : links.length === 0 ? (
                        <div className="text-slate-500 p-4 text-center border border-slate-200 rounded-lg dashed">
                            No hay usuarios autorizados registrados. Añada uno manualmente o utilice la importación.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-700">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3">Usuario Autorizado</th>
                                        <th className="px-4 py-3">Investigador Principal</th>
                                        <th className="px-4 py-3">Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {links.map(link => {
                                        const researcher = researchers.find(r => r.id === link.researcherId);
                                        return (
                                            <tr key={link.id} className="border-b border-slate-200 hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{link.name}</td>
                                                <td className="px-4 py-3">{researcher?.fullName || 'Desconocido'}</td>
                                                <td className="px-4 py-3 text-slate-500">{link.email || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Bulk Import */}
                <div className="glass-panel p-6 md:col-span-2">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-blue-600" />
                        Importación Masiva
                    </h2>
                    <p className="text-slate-500 mb-4 text-sm">
                        Importar tabla de relaciones: <code>InvestigadorPrincipal</code> | <code>UsuarioAutorizado</code>
                    </p>
                    <ExcelImporter
                        type="Vinculaciones"
                        templateHeaders={['InvestigadorPrincipal', 'UsuarioAutorizado']}
                        onImport={async (data) => {
                            // ... existing logic ...
                        }}
                    />
                </div>

            </div>
        </div>
    );
};

export default Associates;
