import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, FilePenLine } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import ResearcherForm from '../components/ResearcherForm';
import ExcelImporter from '../components/ExcelImporter';
import { cn } from '../lib/utils';
import styles from './Researchers.module.css';

const Researchers = () => {
    const { researchers, addResearcher, deleteResearcher, updateResearcher } = useAppContext();
    const [selectedResearcher, setSelectedResearcher] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'fullName', direction: 'asc' });

    const filteredResearchers = researchers.filter(researcher =>
        (researcher.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (researcher.center || researcher.institution || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (researcher.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedResearchers = [...filteredResearchers].sort((a, b) => {
        if (!sortConfig.key) return 0;
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';

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

    const handleCreateOrUpdate = async (data) => {
        if (selectedResearcher) {
            await updateResearcher(selectedResearcher.id, data);
        } else {
            await addResearcher(data);
        }
        setIsModalOpen(false);
        setSelectedResearcher(null);
    };

    const openEditModal = (researcher) => {
        setSelectedResearcher(researcher);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedResearcher(null);
        setIsModalOpen(true);
    };

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Investigadores</h1>
                    <p className={styles.subtitle}>Gestión de usuarios y tarifas</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    Nuevo Investigador
                </button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} className="text-slate-500" />
                    <input
                        placeholder="Buscar investigador..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex-1"></div>
                <ExcelImporter
                    type="Investigadores"
                    templateHeaders={['InvestigadorPrincipal', 'Institucion', 'e-mail', 'Tarifa']}
                    onImport={async (data) => {
                        let count = 0;
                        for (const row of data) {
                            const fullName = row['InvestigadorPrincipal'] || row['Investigador'] || row['Nombre'];
                            if (!fullName) continue;

                            const researcherData = {
                                fullName: fullName,
                                department: row['Departamento'] || '',
                                center: row['Centro'] || row['Center'] || row['Institucion'] || row['Institución'] || '',
                                institution: row['Institucion'] || row['Institución'] || (row['Centro'] || ''),
                                city: row['Ciudad'] || '',
                                phone: row['Telefono'] || row['Teléfono'] || '',
                                fax: row['FAX'] || row['Fax'] || '',
                                email: row['e-mail'] || row['Email'] || row['Correo'] || '',
                                idNumber: row['CIF'] || row['NIF'] || '',
                                fiscalAddress: row['Direccion Fiscal'] || row['Dirección Fiscal'] || '',
                                invoiceAddress: row['Direccion Factura'] || row['Dirección Factura'] || '',
                                accountingOffice: row['Oficina Contable'] || '',
                                managementBody: row['Organo Gestor'] || row['Órgano Gestor'] || '',
                                processingUnit: row['Unidad Tramitadora'] || '',
                                proposingBody: row['Organo Proponente'] || row['Órgano Proponente'] || '',
                                tariff: row['Tarifa'] || 'C'
                            };
                            await addResearcher(researcherData);
                            count++;
                        }
                        console.log(`Imported ${count} researchers`);
                    }}
                />
            </div>

            <div className={styles.tableContainer}>
                {/* Desktop Table - Grid Style */}
                <div className={styles.desktopView}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('fullName')}>
                                    <div className={styles.thContent}>Nombre <SortIcon columnKey="fullName" /></div>
                                </th>
                                <th onClick={() => handleSort('center')}>
                                    <div className={styles.thContent}>Centro <SortIcon columnKey="center" /></div>
                                </th>
                                <th onClick={() => handleSort('email')}>
                                    <div className={styles.thContent}>Email <SortIcon columnKey="email" /></div>
                                </th>
                                <th onClick={() => handleSort('department')}>
                                    <div className={styles.thContent}>Departamento <SortIcon columnKey="department" /></div>
                                </th>
                                <th className={styles.colActions}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedResearchers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center p-8 text-slate-500">
                                        No hay investigadores que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                sortedResearchers.map(researcher => (
                                    <tr key={researcher?.id || Math.random()}>
                                        <td className="font-medium text-slate-900 border-r">{researcher?.fullName}</td>
                                        <td className="text-slate-600 border-r" title={researcher.center || researcher.institution}>{researcher.center || researcher.institution}</td>
                                        <td className="text-slate-600 border-r" title={researcher.email}>{researcher.email}</td>
                                        <td className="text-slate-600 border-r">{researcher.department}</td>
                                        <td className={styles.colActions}>
                                            <div className="flex justify-center gap-1">
                                                <button onClick={() => openEditModal(researcher)} title="Editar" className="text-slate-500 hover:text-blue-600 hover:bg-slate-100 p-0.5 rounded"><FilePenLine size={14} /></button>
                                                <button onClick={() => deleteResearcher(researcher.id)} title="Eliminar" className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-0.5 rounded"><Trash2 size={14} /></button>
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
                    {filteredResearchers.map(researcher => (
                        <div key={researcher.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{researcher.fullName}</h3>
                                    <p className="text-sm text-slate-500">{researcher.center || researcher.institution}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEditModal(researcher)} className="p-2 text-slate-500 hover:text-blue-600 active:bg-blue-50 rounded-full">
                                        <FilePenLine size={18} />
                                    </button>
                                    <button onClick={() => deleteResearcher(researcher.id)} className="p-2 text-slate-500 hover:text-red-600 active:bg-red-50 rounded-full">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                {researcher.email && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-400 w-20">Email:</span>
                                        <span className="truncate">{researcher.email}</span>
                                    </div>
                                )}
                                {researcher.department && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-400 w-20">Depto:</span>
                                        <span>{researcher.department}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-400 w-20">Tarifa:</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-xs font-bold border",
                                        researcher.tariff === 'A' ? "bg-green-50 text-green-700 border-green-100" :
                                            researcher.tariff === 'B' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                "bg-red-50 text-red-700 border-red-100"
                                    )}>
                                        {researcher.tariff}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={cn("glass-panel", styles.modalContent)}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{selectedResearcher ? 'Editar Investigador' : 'Nuevo Investigador'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <ResearcherForm
                                onSubmit={handleCreateOrUpdate}
                                onCancel={() => setIsModalOpen(false)}
                                initialData={selectedResearcher}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Researchers;
