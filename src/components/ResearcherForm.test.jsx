import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResearcherForm from './ResearcherForm';

describe('ResearcherForm', () => {
    it('renders correctly', () => {
        render(<ResearcherForm onSubmit={() => { }} onCancel={() => { }} />);
        expect(screen.getByText(/Datos Personales/i)).toBeInTheDocument();
        expect(screen.getByText(/Centro/i)).toBeInTheDocument();
    });

    it('updates tariff automatically based on institution', () => {
        render(<ResearcherForm onSubmit={() => { }} onCancel={() => { }} />);

        const tariffSelect = screen.getByRole('combobox', { name: /Tarifa Asignada/i });

        // Test UCM -> A
        fireEvent.change(screen.getByLabelText(/Centro/i), { target: { value: 'Universidad Complutense de Madrid' } });
        expect(tariffSelect.value).toBe('A');

        // Test Public -> B
        fireEvent.change(screen.getByLabelText(/Centro/i), { target: { value: 'Hospital Gregorio Marañón' } });
        expect(tariffSelect.value).toBe('B');

        // Test Private -> C
        fireEvent.change(screen.getByLabelText(/Centro/i), { target: { value: 'Empresa Privada S.L.' } });
        expect(tariffSelect.value).toBe('C');
    });

    it('submits form data', () => {
        const handleSubmit = vi.fn();
        render(<ResearcherForm onSubmit={handleSubmit} onCancel={() => { }} />);

        fireEvent.change(screen.getByLabelText(/Nombre y Apellidos/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '123456789' } });
        fireEvent.change(screen.getByLabelText(/CIF \/ NIF/i), { target: { value: '12345678A' } });
        fireEvent.change(screen.getByLabelText(/Centro/i), { target: { value: 'UCM' } });

        fireEvent.change(screen.getByLabelText(/Dirección Fiscal/i), { target: { value: 'Street 1' } });
        fireEvent.change(screen.getByLabelText(/Dirección Envío/i), { target: { value: 'Street 2' } });

        fireEvent.click(screen.getByText(/Guardar Investigador/i));

        expect(handleSubmit).toHaveBeenCalled();
        expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({
            fullName: 'John Doe',
            email: 'john@example.com',
            institution: 'UCM',
            tariff: 'A'
        }));
    });
});
