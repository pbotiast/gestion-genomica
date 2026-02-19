import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import DataTable from '../components/DataTable';
import ExcelImporter from '../components/ExcelImporter';
import ServiceForm from '../components/ServiceForm';
import Modal from '../components/Modal';
import styles from './Services.module.css';

const Services = () => {
    const { services, addService, deleteService, updateService } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');

    // Define table columns
    const columns = useMemo(() => [
        {
            accessorKey: 'name',
            header: 'Servicio',
            cell: ({ getValue }) => (
                <span className="font-medium text-slate-900">{getValue()}</span>
            ),
        },
        {
            accessorKey: 'priceA',
            header: 'Tarifa A',
            cell: ({ getValue }) => (
                <span className="text-emerald-600 font-mono font-bold">
                    {Number(getValue() || 0).toFixed(2)} €
                </span>
            ),
        },
        {
            accessorKey: 'priceB',
            header: 'Tarifa B',
            cell: ({ getValue }) => (
                <span className="text-amber-600 font-mono font-bold">
                    {Number(getValue() || 0).toFixed(2)} €
                </span>
            ),
        },
        {
            accessorKey: 'priceC',
            header: 'Tarifa C',
            cell: ({ getValue }) => (
                <span className="text-rose-600 font-mono font-bold">
                    {Number(getValue() || 0).toFixed(2)} €
                </span>
            ),
        },
        {
            accessorKey: 'format',
            header: 'Formato',
            cell: ({ getValue }) => (
                <span className="text-gray-600">{getValue() || '-'}</span>
            ),
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => {
                const service = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(service);
                            }}
                            className="btn-icon-sm text-indigo-600 hover:text-indigo-800"
                            title="Editar"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(service.id);
                            }}
                            className="btn-icon-sm text-red-600 hover:text-red-800"
                            title="Eliminar"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                );
            },
        },
    ], []);

    const handleCreate = (data) => {
        addService(data);
        setIsModalOpen(false);
    };

    const handleUpdate = (data) => {
        if (editingService) {
            updateService(editingService.id, data);
            setEditingService(null);
            setIsModalOpen(false);
        }
    };

    const openEditModal = (service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingService(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este servicio?')) return;
        await deleteService(id);
    };

    const handleImport = async (data) => {
        let count = 0;
        for (const row of data) {
            const name = row['servicio'] || row['Servicio'] || row['NAME'];
            if (!name) continue;

            const parsePrice = (value) => {
                if (typeof value === 'number') return value;
                if (typeof value === 'string') {
                    return parseFloat(value.replace(/[€$,]/g, '').trim()) || 0;
                }
                return 0;
            };

            await addService({
                name,
                priceA: parsePrice(row['A']),
                priceB: parsePrice(row['B']),
                priceC: parsePrice(row['C']),
                format: row['formato'] || row['Formato'] || ''
            });
            count++;
        }
        alert(`Se han importado ${count} servicios.`);
        setIsImportModalOpen(false);
    };

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Catálogo de Servicios</h1>
                    <p className={styles.subtitle}>Gestión de servicios y precios</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary flex items-center gap-2">
                        <Upload size={20} />
                        Importar
                    </button>
                    <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                        <Plus size={20} />
                        Nuevo Servicio
                    </button>
                </div>
            </div>

            {/* Toolbar: Search */}
            <div className="glass-panel p-4">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar servicio por nombre..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Professional Data Table */}
            <DataTable
                columns={columns}
                data={services}
                globalFilter={globalFilter}
                onGlobalFilterChange={setGlobalFilter}
                pageSize={15}
            />

            {/* Modal: Form */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            >
                <ServiceForm
                    onSubmit={editingService ? handleUpdate : handleCreate}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={editingService}
                />
            </Modal>

            {/* Modal: Import */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Importación Masiva de Servicios"
            >
                <ExcelImporter
                    type="Servicios"
                    templateHeaders={['servicio', 'A', 'B', 'C']}
                    onImport={handleImport}
                />
            </Modal>
        </div>
    );
};

export default Services;
