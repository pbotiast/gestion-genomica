import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RequestForm from './RequestForm';
import { AppContext } from '../context/AppContext';

// Mock context value
const mockContextValue = {
    researchers: [
        { id: '1', fullName: 'Dr. Smith', institution: 'Institute A', tariff: 'A' },
        { id: '2', fullName: 'Dr. Jones', institution: 'Institute B', tariff: 'B' }
    ],
    services: [
        { id: 's1', name: 'Sequencing', format: 'Tube' },
        { id: 's2', name: 'Analysis', format: 'Digital' }
    ],
    technicians: ['Tech 1', 'Tech 2'],
    requests: []
};

const renderWithContext = (component) => {
    return render(
        <AppContext.Provider value={mockContextValue}>
            {component}
        </AppContext.Provider>
    );
};

describe('RequestForm', () => {
    it('renders all form sections', () => {
        renderWithContext(<RequestForm onSubmit={() => { }} onCancel={() => { }} />);

        expect(screen.getByText(/Nº Registro/i)).toBeInTheDocument();
        expect(screen.getByText(/Datos del Investigador/i)).toBeInTheDocument();
        expect(screen.getByText(/Datos del Servicio/i)).toBeInTheDocument();
    });

    it('populates researcher dropdown', () => {
        renderWithContext(<RequestForm onSubmit={() => { }} onCancel={() => { }} />);

        const researcherSelect = screen.getByRole('combobox', { name: /Investigador/i });
        expect(researcherSelect).toBeInTheDocument();
        expect(screen.getByText('Dr. Smith - Institute A')).toBeInTheDocument();
    });

    it('autofills institution and tariff when researcher is selected', () => {
        renderWithContext(<RequestForm onSubmit={() => { }} onCancel={() => { }} />);

        const researcherSelect = screen.getByRole('combobox', { name: /Investigador/i });
        fireEvent.change(researcherSelect, { target: { value: '1' } });

        expect(screen.getByDisplayValue('Institute A')).toBeInTheDocument();
        expect(screen.getByDisplayValue('A')).toBeInTheDocument();
    });

    it('calls onSubmit with form data', () => {
        const handleSubmit = vi.fn();
        renderWithContext(<RequestForm onSubmit={handleSubmit} onCancel={() => { }} />);

        // Fill required fields
        fireEvent.change(screen.getByRole('combobox', { name: /Investigador/i }), { target: { value: '1' } });
        fireEvent.change(screen.getByRole('combobox', { name: /Servicio Solicitado/i }), { target: { value: 's1' } });
        fireEvent.change(screen.getByLabelText(/Nº Muestras/i), { target: { value: '5' } });

        // Submit
        fireEvent.click(screen.getByText(/Registrar Solicitud/i));

        expect(handleSubmit).toHaveBeenCalled();
        expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({
            researcherId: '1',
            serviceId: 's1',
            samplesCount: '5'
        }));
    });
});
