import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import CenterForm from '../components/CenterForm';
import { cn } from '../lib/utils';
import styles from './Researchers.module.css'; // Reutilizamos estilos similares

const Centers = () => {
    const { centers, addCenter, updateCenter, deleteCenter, loading } = useAppContext();
    const [showForm, setShowForm] = useState(false);
    const [editingCenter, setEditingCenter] = useState(null);

    const handleAdd = async (data) => {
        await addCenter(data);
        setShowForm(false);
    };

    const handleEdit = (center) => {
        setEditingCenter(center);
        setShowForm(true);
    };

    const handleUpdate = async (data) => {
        if (editingCenter) {
            await updateCenter(editingCenter.id, data);
            setEditingCenter(null);
            setShowForm(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este centro? Los investigadores asociados quedarán sin centro.')) {
            await deleteCenter(id);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingCenter(null);
    };

    const getTariffBadgeClass = (tariff) => {
        switch (tariff) {
            case 'A': return 'badge-success';
            case 'B': return 'badge-info';
            case 'C': return 'badge-warning';
            default: return 'badge-primary';
        }
    };

    const getCenterTypeLabel = (type) => {
        switch (type) {
            case 'UCM': return 'UCM';
            case 'PUBLICO': return 'Público';
            case 'PRIVADO': return 'Privado';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="skeleton w-full h-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className={cn(styles.title, "text-gradient")}>
                    Centros de Investigación
                </h1>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Nuevo Centro
                    </button>
                )}
            </div>

            {showForm && (
                <div className="glass-panel p-6 fade-in">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        {editingCenter ? 'Editar Centro' : 'Añadir Nuevo Centro'}
                    </h2>
                    <CenterForm
                        onSubmit={editingCenter ? handleUpdate : handleAdd}
                        onCancel={handleCancel}
                        initialData={editingCenter}
                    />
                </div>
            )}

            {centers.length === 0 ? (
                <div className="glass-panel p-12 text-center">
                    <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No hay centros registrados
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Comienza añadiendo un centro de investigación para poder asociar investigadores.
                    </p>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Crear Primer Centro
                        </button>
                    )}
                </div>
            ) : (
                <div className="glass-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Centro
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tarifa
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ciudad
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CIF
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {centers.map((center) => (
                                    <tr key={center.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <Building2 size={18} className="text-indigo-500 mr-2" />
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {center.name}
                                                    </div>
                                                    {center.address && (
                                                        <div className="text-xs text-gray-500">
                                                            {center.address}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-700">
                                                {getCenterTypeLabel(center.centerType)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn('badge', getTariffBadgeClass(center.tariff))}>
                                                Tarifa {center.tariff}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {center.city || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                            {center.cif || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(center)}
                                                    className="btn-icon-sm text-indigo-600 hover:text-indigo-800"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(center.id)}
                                                    className="btn-icon-sm text-red-600 hover:text-red-800"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Centers;
