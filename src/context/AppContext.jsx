import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

export const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const { user } = useAuth();

    // Researchers State
    const [researchers, setResearchers] = useState([]);
    const [services, setServices] = useState([]);
    const [requests, setRequests] = useState([]);
    const [invoices, setInvoices] = useState([]);

    // Associates State
    const [associates, setAssociates] = useState([]);



    // Auxiliary Data State
    const [technicians, setTechnicians] = useState([]);
    const [formats, setFormats] = useState(() => {
        try {
            const saved = localStorage.getItem('formats');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Loading State
    const [loading, setLoading] = useState(true);

    // Load initial data from API
    useEffect(() => {
        if (!user) {
            setResearchers([]);
            setServices([]);
            setRequests([]);
            setInvoices([]);
            setAssociates([]);
            setTechnicians([]);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [resResearchers, resServices, resRequests, resTechnicians, resAssociates, resInvoices] = await Promise.all([
                    api.get('/researchers'),
                    api.get('/services'),
                    api.get('/requests'),
                    api.get('/technicians'),
                    api.get('/associates'),
                    api.get('/invoices')
                ]);

                if (resResearchers) setResearchers(resResearchers);
                if (resServices) setServices(resServices);
                if (resRequests) setRequests(resRequests);
                if (resTechnicians) setTechnicians(resTechnicians.map(t => t.name));
                if (resAssociates) setAssociates(resAssociates);
                if (resInvoices) setInvoices(resInvoices);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Persistence for auxiliary data (only formats for now)
    useEffect(() => {
        localStorage.setItem('formats', JSON.stringify(formats));
    }, [formats]);

    // --- Actions ---

    // Researchers
    const addResearcher = async (data) => {
        try {
            const res = await api.post('/researchers', data);
            if (res) {
                setResearchers(prev => [...prev, res]);
                toast.success('Investigador registrado');
                return res;
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al registrar investigador');
        }
    };

    const updateResearcher = async (id, data) => {
        try {
            const res = await api.put(`/researchers/${id}`, data);
            if (res) {
                setResearchers(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
                toast.success('Investigador actualizado');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar investigador');
        }
    };

    const deleteResearcher = async (id) => {
        try {
            await api.delete(`/researchers/${id}`);
            setResearchers(prev => prev.filter(item => item.id !== id));
            toast.success('Investigador eliminado');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Error al eliminar investigador');
        }
    };

    // Services
    const addService = async (data) => {
        try {
            const res = await api.post('/services', data);
            if (res) {
                setServices(prev => [...prev, res]);
                toast.success('Servicio creado');
                return res;
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al crear servicio');
        }
    };

    const updateService = async (id, data) => {
        // Backend TODO: Implement PUT
        setServices(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
        toast.info('Servicio actualizado (Localmente)');
    };

    const deleteService = async (id) => {
        try {
            await api.delete(`/services/${id}`);
            setServices(prev => prev.filter(item => item.id !== id));
            toast.success('Servicio eliminado');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Error al eliminar servicio');
        }
    };

    // Requests
    const createRequest = async (data) => {
        try {
            const res = await api.post('/requests', data);
            if (res) {
                setRequests(prev => [res, ...prev]);
                toast.success('Solicitud creada');
                return res;
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al crear solicitud');
        }
    };

    const updateRequest = async (id, data) => {
        try {
            const res = await api.put(`/requests/${id}`, data);
            if (res) {
                setRequests(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
                toast.success('Solicitud actualizada');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar solicitud');
        }
    };

    const updateRequestStatus = async (id, status) => {
        return updateRequest(id, { status });
    };

    const deleteRequest = async (id) => {
        try {
            await api.delete(`/requests/${id}`);
            setRequests(prev => prev.filter(item => item.id !== id));
            toast.success('Solicitud eliminada');
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar solicitud');
        }
    };

    // Invoices
    const createInvoice = async (data) => {
        try {
            const res = await api.post('/invoices', data);
            if (res) {
                setInvoices(prev => [res, ...prev]);
                // Update requests status locally if needed, though usually backend handles it
                if (data.requestIds) {
                    setRequests(prev => prev.map(r => data.requestIds.includes(r.id) ? { ...r, status: 'billed', invoiceId: res.id } : r));
                }
                toast.success('Factura generada');
                return res;
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al generar factura');
        }
    };

    // Formats (Local)
    const addFormat = (format) => {
        if (!formats.includes(format)) {
            setFormats(prev => [...prev, format]);
            toast.success('Formato añadido');
        }
    };

    const deleteFormat = (format) => {
        setFormats(prev => prev.filter(f => f !== format));
    };

    const updateFormat = (oldFormat, newFormat) => {
        setFormats(prev => prev.map(f => f === oldFormat ? newFormat : f));
    };

    // Technicians
    const addTechnician = async (name) => {
        try {
            const res = await api.post('/technicians', { name });
            if (res) {
                setTechnicians(prev => [...prev, res.name]);
                toast.success('Técnico añadido');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al añadir técnico');
        }
    };

    const deleteTechnician = async (name) => {
        try {
            await api.delete(`/technicians/${encodeURIComponent(name)}`);
            setTechnicians(prev => prev.filter(t => t !== name));
            toast.success('Técnico eliminado');
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar técnico');
        }
    };

    const updateTechnician = (oldName, newName) => {
        // Backend TODO
        setTechnicians(prev => prev.map(t => t === oldName ? newName : t));
    };


    // Associates
    const addAssociate = async (researcherId, data) => {
        try {
            const res = await api.post(`/researchers/${researcherId}/associates`, data);
            if (res) {
                setAssociates(prev => [...prev, res]);
                toast.success('Asociado añadido');
                return res;
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al añadir asociado');
        }
    };

    const updateAssociate = async (id, data) => {
        try {
            const res = await api.put(`/associates/${id}`, data);
            if (res) {
                setAssociates(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
                toast.success('Asociado actualizado');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar asociado');
        }
    };

    const deleteAssociate = async (id) => {
        try {
            await api.delete(`/associates/${id}`);
            setAssociates(prev => prev.filter(a => a.id !== id));
            toast.success('Asociado eliminado');
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar asociado');
        }
    };




    return (
        <AppContext.Provider value={{
            loading,
            researchers,
            addResearcher,
            updateResearcher,
            deleteResearcher,
            services, addService, deleteService, updateService, setServices,
            requests, setRequests, updateRequestStatus, createRequest, updateRequest, deleteRequest,
            invoices, createInvoice, formats, addFormat, deleteFormat, updateFormat, setFormats,
            technicians, addTechnician, deleteTechnician, updateTechnician,
            associates, addAssociate, deleteAssociate, updateAssociate
        }}>
            {children}
        </AppContext.Provider>
    );
};
