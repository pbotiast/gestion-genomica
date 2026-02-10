import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    // Researchers State
    const [researchers, setResearchers] = useState(() => {
        const saved = localStorage.getItem('researchers');
        return saved ? JSON.parse(saved) : [];
    });

    const [services, setServices] = useState(() => {
        const saved = localStorage.getItem('services');
        return saved ? JSON.parse(saved) : [];
    });

    const [requests, setRequests] = useState(() => {
        const saved = localStorage.getItem('requests');
        return saved ? JSON.parse(saved) : [];
    });

    const [formats, setFormats] = useState(() => {
        const saved = localStorage.getItem('formats');
        return saved ? JSON.parse(saved) : ['Tubo', 'Placa 96', 'Placa 384'];
    });

    const [technicians, setTechnicians] = useState(() => {
        const saved = localStorage.getItem('technicians');
        return saved ? JSON.parse(saved) : ['Técnico 1', 'Técnico 2'];
    });

    // Persistence
    useEffect(() => {
        localStorage.setItem('researchers', JSON.stringify(researchers));
    }, [researchers]);

    useEffect(() => {
        localStorage.setItem('services', JSON.stringify(services));
    }, [services]);

    useEffect(() => {
        localStorage.setItem('requests', JSON.stringify(requests));
    }, [requests]);

    useEffect(() => {
        localStorage.setItem('formats', JSON.stringify(formats));
    }, [formats]);

    useEffect(() => {
        localStorage.setItem('technicians', JSON.stringify(technicians));
    }, [technicians]);

    // Actions
    const addResearcher = (researcher) => {
        setResearchers(prev => [...prev, { ...researcher, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
    };

    const updateResearcher = (id, data) => {
        setResearchers(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    };

    const deleteResearcher = (id) => {
        setResearchers(prev => prev.filter(r => r.id !== id));
    };

    const updateRequestStatus = (id, status) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    };

    const addService = (service) => {
        if (Array.isArray(service)) {
            const newServices = service.map(s => ({ ...s, id: crypto.randomUUID() }));
            setServices(prev => [...prev, ...newServices]);
        } else {
            setServices(prev => [...prev, { ...service, id: crypto.randomUUID() }]);
        }
    };

    const deleteService = (id) => {
        setServices(prev => prev.filter(s => s.id !== id));
    };

    const addFormat = (format) => {
        if (!formats.includes(format)) setFormats(prev => [...prev, format]);
    };

    const deleteFormat = (format) => {
        setFormats(prev => prev.filter(f => f !== format));
    };

    const addTechnician = (tech) => {
        if (!technicians.includes(tech)) setTechnicians(prev => [...prev, tech]);
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
            updateRequestStatus,
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
