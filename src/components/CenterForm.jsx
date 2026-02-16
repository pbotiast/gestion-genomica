import React, { useState } from 'react';
import { cn } from '../lib/utils';

const CenterForm = ({ onSubmit, onCancel, initialData = null }) => {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        centerType: 'PUBLICO',
        address: '',
        postalCode: '',
        city: '',
        cif: '',
        electronicBillingCode: '',
        electronicBillingOffice: '',
        electronicBillingAgency: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // Mostrar tarifa que se asignará automáticamente
    const getTariff = (type) => {
        switch (type) {
            case 'UCM': return 'A';
            case 'PUBLICO': return 'B';
            case 'PRIVADO': return 'C';
            default: return '';
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Información básica */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Centro *
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ej: Universidad Complutense de Madrid"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Centro *
                    </label>
                    <select
                        name="centerType"
                        value={formData.centerType}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="UCM">UCM</option>
                        <option value="PUBLICO">Público (Universidad/CSIC)</option>
                        <option value="PRIVADO">Privado</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tarifa Asignada (Automática)
                    </label>
                    <input
                        type="text"
                        value={`Tarifa ${getTariff(formData.centerType)}`}
                        disabled
                        className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                    />
                </div>

                {/* Datos de facturación */}
                <div className="md:col-span-2">
                    <h3 className="text-md font-semibold text-gray-800 mb-3 mt-2">
                        Datos de Facturación
                    </h3>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        CIF
                    </label>
                    <input
                        type="text"
                        name="cif"
                        value={formData.cif}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="A12345678"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código Postal
                    </label>
                    <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="28040"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad
                    </label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Madrid"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                    </label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Dirección completa del centro"
                    />
                </div>

                {/* Datos de facturación electrónica */}
                <div className="md:col-span-2">
                    <h3 className="text-md font-semibold text-gray-800 mb-3 mt-2">
                        Facturación Electrónica (Opcional)
                    </h3>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código DIR3
                    </label>
                    <input
                        type="text"
                        name="electronicBillingCode"
                        value={formData.electronicBillingCode}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="DIR3"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Oficina Contable
                    </label>
                    <input
                        type="text"
                        name="electronicBillingOffice"
                        value={formData.electronicBillingOffice}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Órgano Gestor
                    </label>
                    <input
                        type="text"
                        name="electronicBillingAgency"
                        value={formData.electronicBillingAgency}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn-secondary px-6 py-2"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="btn-primary px-6 py-2"
                >
                    {initialData ? 'Actualizar Centro' : 'Crear Centro'}
                </button>
            </div>
        </form>
    );
};

export default CenterForm;
