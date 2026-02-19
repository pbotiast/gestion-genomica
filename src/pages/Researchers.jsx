import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { Badge } from '../components/UI';
import DataTable from '../components/DataTable';
import ResearcherForm from '../components/ResearcherForm';
import ExcelImporter from '../components/ExcelImporter';
import Modal from '../components/Modal';
import styles from './Researchers.module.css';

const Researchers = () => {
    const { researchers, addResearcher, deleteResearcher, updateResearcher } = useAppContext();
    const [selectedResearcher, setSelectedResearcher] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

    const getTariffColor = (tariff) => {
        const colors = {
            'A': 'success',
            'B': 'warning',
            'C': 'danger'
        };
        return colors[tariff] || 'primary';
    };

    // Define table columns
    const columns = useMemo(() => [
        {
            accessorKey: 'fullName',
            header: 'Nombre',
            cell: ({ getValue }) => (
                <span className="font-medium text-slate-900">{getValue()}</span>
            ),
        },
        {
            accessorKey: 'center',
            header: 'Centro',
            cell: ({ getValue, row }) => (
                <div className="max-w-xs truncate text-gray-600" title={getValue()}>
                    {getValue() || row.original.institution || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ getValue }) => (
                <div className="max-w-xs truncate text-gray-600" title={getValue()}>
                    {getValue() || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'department',
            header: 'Departamento',
            cell: ({ getValue }) => (
                <span className="text-gray-600">{getValue() || '-'}</span>
            ),
        },
        {
            accessorKey: 'tariff',
            header: 'Tarifa',
            cell: ({ getValue }) => {
                const tariff = getValue();
                return (
                    <Badge variant={getTariffColor(tariff)}>
                        Tarifa {tariff}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => {
                const researcher = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(researcher);
                            }}
                            className="btn-icon-sm text-indigo-600 hover:text-indigo-800"
                            title="Editar"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(researcher.id);
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

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este investigador?')) return;
        await deleteResearcher(id);
    };

    const handleImport = async (data) => {
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
    };

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Investigadores</h1>
                    <p className={styles.subtitle}>Gestión de usuarios y tarifas</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary flex items-center gap-2">
                        <Upload size={20} />
                        Importar
                    </button>
                    <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                        <Plus size={20} />
                        Nuevo Investigador
                    </button>
                </div>
            </div>

            {/* Toolbar: Search */}
            <div className="glass-panel p-4">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, centro, email..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Professional Data Table */}
            <DataTable
                columns={columns}
                data={researchers}
                globalFilter={globalFilter}
                onGlobalFilterChange={setGlobalFilter}
                pageSize={15}
            />

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {selectedResearcher ? 'Editar Investigador' : 'Nuevo Investigador'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <ResearcherForm
                                onSubmit={handleCreateOrUpdate}
                                onCancel={() => setIsModalOpen(false)}
                                initialData={selectedResearcher}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Import */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Importación Masiva de Investigadores"
            >
                <ExcelImporter
                    type="Investigadores"
                    templateHeaders={['InvestigadorPrincipal', 'Institucion', 'e-mail', 'Tarifa']}
                    onImport={handleImport}
                />
            </Modal>
        </div>
    );
};

export default Researchers;
