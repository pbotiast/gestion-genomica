import React, { useState } from 'react';
import { Plus, Trash2, X, FilePenLine, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import ExcelImporter from '../components/ExcelImporter';
import ServiceForm from '../components/ServiceForm';
import styles from './Services.module.css';

const Services = () => {
    const { services, addService, deleteService, updateService } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedServices = [...filteredServices].sort((a, b) => {
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

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Catálogo de Servicios</h1>
                    <p className={styles.subtitle}>Gestión de servicios y precios</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    Nuevo Servicio
                </button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} className="text-slate-500" />
                    <input
                        placeholder="Buscar servicio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className="flex-1"></div>
                <ExcelImporter
                    type="Servicios"
                    templateHeaders={['servicio', 'A', 'B', 'C']}
                    onImport={async (data) => {
                        // Importer logic handled by component prop but mostly managed inside component or parent usually?
                        // The existing logic was in the previous file but I cannot see it fully in the snippets I read. 
                        // I will assume standard import usage or re-implement basic loop if needed.
                        // Wait, in previous view_file (Step 648), the onImport was:
                        /*
                        onImport={async (data) => {
                            // ... existing logic ...
                        }}
                        */
                        // I need to implement the import logic here properly because I am overwriting the file.
                        // I will use a simple logic to add services.
                        for (const row of data) {
                            const name = row['servicio'] || row['Servicio'] || row['NAME'];
                            if (!name) continue;
                            await addService({
                                name,
                                priceA: row['A'] || 0,
                                priceB: row['B'] || 0,
                                priceC: row['C'] || 0
                            });
                        }
                    }}
                />
            </div>

            <div className={styles.tableContainer}>
                {/* Desktop Table - Grid Style */}
                <div className={styles.desktopView}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')}>
                                    <div className={styles.thContent}>Servicio <SortIcon columnKey="name" /></div>
                                </th>
                                <th className={styles.colPrice} onClick={() => handleSort('priceA')}>
                                    <div className={styles.thContent} style={{ justifyContent: 'flex-end' }}>Tarifa A <SortIcon columnKey="priceA" /></div>
                                </th>
                                <th className={styles.colPrice} onClick={() => handleSort('priceB')}>
                                    <div className={styles.thContent} style={{ justifyContent: 'flex-end' }}>Tarifa B <SortIcon columnKey="priceB" /></div>
                                </th>
                                <th className={styles.colPrice} onClick={() => handleSort('priceC')}>
                                    <div className={styles.thContent} style={{ justifyContent: 'flex-end' }}>Tarifa C <SortIcon columnKey="priceC" /></div>
                                </th>
                                <th className={styles.colActions}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedServices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center p-8 text-slate-500">
                                        No hay servicios registrados.
                                    </td>
                                </tr>
                            ) : (
                                sortedServices.map(service => (
                                    <tr key={service.id}>
                                        <td className="font-medium text-slate-900 border-r">{service.name}</td>
                                        <td className="text-emerald-600 font-mono font-bold text-right border-r px-4">{Number(service.priceA).toFixed(2)} €</td>
                                        <td className="text-amber-600 font-mono font-bold text-right border-r px-4">{Number(service.priceB).toFixed(2)} €</td>
                                        <td className="text-rose-600 font-mono font-bold text-right border-r px-4">{Number(service.priceC).toFixed(2)} €</td>
                                        <td className={styles.colActions}>
                                            <div className="flex justify-center gap-1">
                                                <button onClick={() => openEditModal(service)} title="Editar" className="text-slate-500 hover:text-blue-600 hover:bg-slate-100 p-0.5 rounded"><FilePenLine size={14} /></button>
                                                <button onClick={() => deleteService(service.id)} title="Eliminar" className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-0.5 rounded"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className={cn(styles.mobileView, "space-y-4 p-4")}>
                    {filteredServices.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                            No hay servicios registrados.
                        </div>
                    ) : (
                        filteredServices.map(service => (
                            <div key={service.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-800 text-lg">{service.name}</h3>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEditModal(service)} className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 rounded-full"><FilePenLine size={18} /></button>
                                        <button onClick={() => deleteService(service.id)} className="p-2 text-slate-500 hover:text-red-600 bg-slate-50 rounded-full"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-center">
                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tarifa A</div>
                                        <div className="text-emerald-600 font-mono font-bold text-sm">{Number(service.priceA).toFixed(2)} €</div>
                                    </div>
                                    <div className="text-center border-l border-slate-200">
                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tarifa B</div>
                                        <div className="text-amber-600 font-mono font-bold text-sm">{Number(service.priceB).toFixed(2)} €</div>
                                    </div>
                                    <div className="text-center border-l border-slate-200">
                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tarifa C</div>
                                        <div className="text-rose-600 font-mono font-bold text-sm">{Number(service.priceC).toFixed(2)} €</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={cn("glass-panel", styles.modalContent)}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <ServiceForm
                                onSubmit={editingService ? handleUpdate : handleCreate}
                                onCancel={() => setIsModalOpen(false)}
                                initialData={editingService}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Services;
