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
                <p className="text-slate-400">Gestión de vinculaciones entre Investigadores y Usuarios Autorizados</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Manual Management */}
                <div className="glass-panel p-6 md:col-span-2">
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <LinkIcon size={20} className="text-emerald-400" />
                        Gestión Manual
                    </h2>

                    {/* Add Form */}
                    <div className="bg-slate-800/50 p-4 rounded-lg mb-6 border border-slate-700">
                        <h3 className="text-sm font-medium text-slate-300 mb-2">Añadir Nueva Vinculación</h3>
                        <div className="flex flex-col md:flex-row gap-2 items-end">
                            <div className="flex-1 w-full">
                                <label className="text-xs text-slate-400 mb-1 block">Investigador Principal</label>
                                <select
                                    id="link-researcher"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                                >
                                    <option value="">Seleccionar...</option>
                                    {researchers.map(r => (
                                        <option key={r.id} value={r.id}>{r.fullName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 w-full">
                                <label className="text-xs text-slate-400 mb-1 block">Usuario Autorizado (Apellidos, Nombre)</label>
                                <input
                                    id="link-associate"
                                    placeholder="Ej: Perez, Juan"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <button onClick={handleAddLink} className="btn-primary">
                                Añadir
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-slate-400">Cargando vinculaciones...</div>
                    ) : links.length === 0 ? (
                        <div className="text-slate-400 p-4 text-center border border-slate-700 rounded-lg dashed">
                            No hay usuarios autorizados registrados. Añada uno manualmente o utilice la importación.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-300">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
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
                                            <tr key={link.id} className="border-b border-slate-700 hover:bg-slate-800/20">
                                                <td className="px-4 py-3 font-medium">{link.name}</td>
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
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-blue-400" />
                        Importación Masiva
                    </h2>
                    <p className="text-slate-400 mb-4 text-sm">
                        Importar tabla de relaciones: <code>InvestigadorPrincipal</code> | <code>UsuarioAutorizado</code>
                    </p>
                    <ExcelImporter
                        type="Vinculaciones"
                        templateHeaders={['InvestigadorPrincipal', 'UsuarioAutorizado']}
                        onImport={async (data) => {
                            let count = 0;
                            let errors = 0;
                            for (const row of data) {
                                const researcherName = row['InvestigadorPrincipal'] || row['Investigador Principal'];
                                const associateName = row['UsuarioAutorizado'] || row['Usuario Autorizado'];

                                if (!researcherName || !associateName) continue;

                                const researcher = researchers.find(r =>
                                    r.fullName.trim().toLowerCase() === researcherName.trim().toLowerCase()
                                );

                                if (researcher) {
                                    try {
                                        await fetch(`http://localhost:3000/api/researchers/${researcher.id}/associates`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                name: associateName,
                                                email: row['Email'] || ''
                                            })
                                        });
                                        count++;
                                    } catch (err) {
                                        console.error(err);
                                        errors++;
                                    }
                                } else {
                                    errors++;
                                }
                            }
                            console.log(`Linked ${count} users.`);
                            fetchLinks(); // Refresh after import
                            if (errors > 0) alert(`Importación completada con ${errors} errores (investigadores no encontrados).`);
                        }}
                    />
                </div>

            </div>
        </div>
    );
};

export default Associates;
