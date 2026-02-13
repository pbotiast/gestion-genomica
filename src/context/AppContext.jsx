import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    // Researchers State
    const [researchers, setResearchers] = useState([]);
    const [services, setServices] = useState([]);
    const [requests, setRequests] = useState([]);
    const [invoices, setInvoices] = useState([]);

    // Auxiliary data (keeping in localStorage or hardcoded for now as per plan focus on main entities)
    const [formats, setFormats] = useState(() => {
        const saved = localStorage.getItem('formats');
        return saved ? JSON.parse(saved) : ['Tubo', 'Placa 96', 'Placa 384'];
    });

    // Technicians State
    const [technicians, setTechnicians] = useState([]);

    // Associates State
    const [associates, setAssociates] = useState([]);

    // Load initial data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resResearchers, resServices, resRequests, resTechnicians, resAssociates, resInvoices] = await Promise.all([
                    fetch('http://localhost:3000/api/researchers'),
                    fetch('http://localhost:3000/api/services'),
                    fetch('http://localhost:3000/api/requests'),
                    fetch('http://localhost:3000/api/technicians'),
                    fetch('http://localhost:3000/api/associates'),
                    fetch('http://localhost:3000/api/invoices')
                ]);

                if (resResearchers.ok) setResearchers(await resResearchers.json());
                if (resServices.ok) setServices(await resServices.json());
                if (resRequests.ok) setRequests(await resRequests.json());
                if (resTechnicians.ok) {
                    const techs = await resTechnicians.json();
                    setTechnicians(techs.map(t => t.name)); // Keep simple array of names for now to minimize refactor
                }
                if (resAssociates.ok) setAssociates(await resAssociates.json());
                if (resInvoices.ok) setInvoices(await resInvoices.json());
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };
        fetchData();
    }, []);

    // Persistence for auxiliary data (only formats for now)
    useEffect(() => {
        localStorage.setItem('formats', JSON.stringify(formats));
    }, [formats]);

    // Actions
    const addResearcher = async (researcher) => {
        try {
            const response = await fetch('http://localhost:3000/api/researchers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(researcher)
            });
            const savedResearcher = await response.json();
            setResearchers(prev => [...prev, savedResearcher]);
        } catch (error) {
            console.error("Error adding researcher:", error);
        }
    };

    const updateResearcher = async (id, data) => {
        try {
            const response = await fetch(`http://localhost:3000/api/researchers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                setResearchers(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
            }
        } catch (error) {
            console.error("Error updating researcher:", error);
        }
    };

    const deleteResearcher = async (id) => {
        try {
            await fetch(`http://localhost:3000/api/researchers/${id}`, { method: 'DELETE' });
            setResearchers(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error("Error deleting researcher:", error);
        }
    };

    const updateRequestStatus = async (id, status) => {
        try {
            // Optimistic update
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));

            await fetch(`http://localhost:3000/api/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const addService = async (service) => {
        if (Array.isArray(service)) {
            // Bulk add not implemented in API yet, doing loop (inefficient but works for now)
            service.forEach(s => addService(s));
        } else {
            try {
                const response = await fetch('http://localhost:3000/api/services', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(service)
                });
                const savedService = await response.json();
                setServices(prev => [...prev, savedService]);
            } catch (error) {
                console.error("Error adding service:", error);
            }
        }
    };

    const deleteService = async (id) => {
        try {
            await fetch(`http://localhost:3000/api/services/${id}`, { method: 'DELETE' });
            setServices(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error("Error deleting service:", error);
        }
    };

    const updateService = async (id, updates) => {
        try {
            const response = await fetch(`http://localhost:3000/api/services/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (response.ok) {
                setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
            }
        } catch (error) {
            console.error("Error updating service:", error);
        }
    };

    // Keep Request creation logic
    // We need to expose a way to add requests via API
    // The previously existing 'addRequest' or similar logic was seemingly inside RequestForm?
    // Let's ensure we provide a way to add requests.
    // Looking at file content, 'addRequest' was NOT in the exported values in previous version?
    // Ah, logic was likely inside pages or direct state manipulation?
    // Wait, previous file had `setRequests` exposed. RequestForm likely used that?
    // Let's check RequestForm usage. It receives `onSubmit`.
    // We need to provide a function to save requests.

    const createRequest = async (requestData) => {
        try {
            const response = await fetch('http://localhost:3000/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            const savedRequest = await response.json();
            setRequests(prev => [...prev, savedRequest]);
            return savedRequest;
        } catch (error) {
            console.error("Error adding request:", error);
            throw error;
        }
    };

    const updateRequest = async (id, updates) => {
        try {
            const response = await fetch(`http://localhost:3000/api/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (response.ok) {
                setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
            }
        } catch (error) {
            console.error("Error updating request:", error);
            throw error;
        }
    };

    const deleteRequest = async (id) => {
        try {
            await fetch(`http://localhost:3000/api/requests/${id}`, { method: 'DELETE' });
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error("Error deleting request:", error);
        }
    };

    const createInvoice = async (invoiceData) => {
        try {
            const response = await fetch('http://localhost:3000/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData)
            });
            if (response.ok) {
                const newInvoice = await response.json();
                setInvoices(prev => [newInvoice, ...prev]);

                // Update local requests status
                if (invoiceData.requestIds) {
                    setRequests(prev => prev.map(req =>
                        invoiceData.requestIds.includes(req.id)
                            ? { ...req, status: 'billed', invoiceId: newInvoice.id }
                            : req
                    ));
                }
                return newInvoice;
            }
        } catch (error) {
            console.error("Error creating invoice:", error);
            throw error;
        }
    };



    const addFormat = (format) => {
        if (!formats.includes(format)) setFormats(prev => [...prev, format]);
    };

    const deleteFormat = (format) => {
        setFormats(prev => prev.filter(f => f !== format));
    };

    const updateFormat = (oldFormat, newFormat) => {
        setFormats(prev => prev.map(f => f === oldFormat ? newFormat : f));
    };

    const addTechnician = async (techName) => {
        if (!technicians.includes(techName)) {
            try {
                await fetch('http://localhost:3000/api/technicians', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: techName })
                });
                setTechnicians(prev => [...prev, techName]);
            } catch (error) {
                console.error("Error adding technician", error);
            }
        }
    };

    const deleteTechnician = async (techName) => {
        // API delete logic if available, otherwise just local state
        // Assuming API might not have delete by name easily or returns 200
        try {
            // If there's an ID we should use it, but we stored just names.
            // We'll just update state for now as per previous implementation pattern
            setTechnicians(prev => prev.filter(t => t !== techName));
        } catch (error) {
            console.error("Error deleting technician", error);
        }
    };

    const updateTechnician = (oldName, newName) => {
        setTechnicians(prev => prev.map(t => t === oldName ? newName : t));
        // ideally sync with API
    };

    // Associates Actions
    const addAssociate = async (researcherId, name, email) => {
        try {
            const res = await fetch(`http://localhost:3000/api/researchers/${researcherId}/associates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
            });
            if (res.ok) {
                const newAssociate = await res.json();
                setAssociates(prev => [...prev, newAssociate]);
                return newAssociate;
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const deleteAssociate = async (id) => {
        try {
            await fetch(`http://localhost:3000/api/associates/${id}`, { method: 'DELETE' });
            setAssociates(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error("Error deleting associate:", error);
        }
    };

    const updateAssociate = async (id, data) => {
        try {
            const res = await fetch(`http://localhost:3000/api/associates/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setAssociates(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
            }
        } catch (error) {
            console.error("Error updating associate:", error);
        }
    };

    return (
        <AppContext.Provider value={{
            researchers,
            addResearcher,
            updateResearcher,
            deleteResearcher,
            services,
            addService,
            deleteService,
            updateService,
            setServices,
            requests,
            setRequests,
            updateRequestStatus,
            setRequests,
            updateRequestStatus,
            createRequest,
            updateRequest,
            deleteRequest,
            invoices,
            createInvoice,
            formats,
            addFormat,
            deleteFormat,
            updateFormat,
            setFormats,
            technicians,
            addTechnician,
            deleteTechnician,
            updateTechnician,
            associates,
            addAssociate,
            deleteAssociate,
            updateAssociate
        }}>
            {children}
        </AppContext.Provider>
    );
};
