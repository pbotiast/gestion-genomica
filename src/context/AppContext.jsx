import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    // Researchers State
    const [researchers, setResearchers] = useState([]);
    const [services, setServices] = useState([]);
    const [requests, setRequests] = useState([]);

    // Auxiliary data (keeping in localStorage or hardcoded for now as per plan focus on main entities)
    const [formats, setFormats] = useState(() => {
        const saved = localStorage.getItem('formats');
        return saved ? JSON.parse(saved) : ['Tubo', 'Placa 96', 'Placa 384'];
    });

    // Technicians State
    const [technicians, setTechnicians] = useState([]);

    // Load initial data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resResearchers, resServices, resRequests, resTechnicians] = await Promise.all([
                    fetch('http://localhost:3000/api/researchers'),
                    fetch('http://localhost:3000/api/services'),
                    fetch('http://localhost:3000/api/requests'),
                    fetch('http://localhost:3000/api/technicians')
                ]);

                if (resResearchers.ok) setResearchers(await resResearchers.json());
                if (resServices.ok) setServices(await resServices.json());
                if (resRequests.ok) setRequests(await resRequests.json());
                if (resTechnicians.ok) {
                    const techs = await resTechnicians.json();
                    setTechnicians(techs.map(t => t.name)); // Keep simple array of names for now to minimize refactor
                }
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

    const updateResearcher = (id, data) => {
        // Optimistic update for UI, ideally should implement PUT endpoint
        setResearchers(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    };

    const deleteResearcher = (id) => {
        // Optimistic update
        setResearchers(prev => prev.filter(r => r.id !== id));
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

    const deleteService = (id) => {
        setServices(prev => prev.filter(s => s.id !== id));
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

    const addFormat = (format) => {
        if (!formats.includes(format)) setFormats(prev => [...prev, format]);
    };

    const deleteFormat = (format) => {
        setFormats(prev => prev.filter(f => f !== format));
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

    const deleteTechnician = (tech) => {
        setTechnicians(prev => prev.filter(t => t !== tech));
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
            setServices,
            requests,
            setRequests,
            setRequests,
            updateRequestStatus,
            updateRequest, // New exposed function
            createRequest, // New exposed function
            formats,
            addFormat,
            deleteFormat,
            setFormats,
            technicians,
            addTechnician,
            deleteTechnician
        }}>
            {children}
        </AppContext.Provider>
    );
};
