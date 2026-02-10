import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResearcherForm from './ResearcherForm';

describe('ResearcherForm', () => {
    it('renders correctly', () => {
        render(<ResearcherForm onSubmit={() => { }} onCancel={() => { }} />);
        // Use accessible queries where possible
        expect(screen.getByRole('heading', { name: /Datos Personales/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /^Institución$/i })).toBeInTheDocument();
    });

    it('updates tariff automatically based on institution', () => {
        render(<ResearcherForm onSubmit={() => { }} onCancel={() => { }} />);

        // Use getByLabelText for inputs associated with labels
        const institutionInput = screen.getByLabelText(/^Institución$/i);
        const tariffSelect = screen.getByRole('combobox', { name: /Tarifa Asignada/i });

        // Test UCM -> A
        fireEvent.change(institutionInput, { target: { value: 'Universidad Complutense de Madrid' } });
        expect(tariffSelect.value).toBe('A');

        // Test Public -> B
        fireEvent.change(institutionInput, { target: { value: 'Hospital Gregorio Marañón' } });
        expect(tariffSelect.value).toBe('B');

        // Test Private -> C
        fireEvent.change(institutionInput, { target: { value: 'Empresa Privada S.L.' } });
        expect(tariffSelect.value).toBe('C');
    });

    it('submits form data', () => {
        const handleSubmit = vi.fn();
        render(<ResearcherForm onSubmit={handleSubmit} onCancel={() => { }} />);

        // Fill out the form
        // Using getByRole to verify accessibility. If these fail, label association is broken.
        fireEvent.change(screen.getByRole('textbox', { name: /Nombre y Apellidos/i }), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByRole('textbox', { name: /Email/i }), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByRole('textbox', { name: /Teléfono/i }), { target: { value: '123456789' } });
        fireEvent.change(screen.getByRole('textbox', { name: /CIF \/ NIF/i }), { target: { value: '12345678A' } });

        fireEvent.change(screen.getByRole('textbox', { name: /^Institución$/i }), { target: { value: 'UCM' } });
        fireEvent.change(screen.getByRole('textbox', { name: /Centro de Investigación/i }), { target: { value: 'Bio Lab' } });

        fireEvent.change(screen.getByRole('textbox', { name: /Dirección Fiscal/i }), { target: { value: 'Street 1' } });
        fireEvent.change(screen.getByRole('textbox', { name: /Dirección Envío/i }), { target: { value: 'Street 2' } });

        // Submit
        fireEvent.click(screen.getByRole('button', { name: /Guardar Investigador/i }));

        expect(handleSubmit).toHaveBeenCalled();
        expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({
            fullName: 'John Doe',
            email: 'john@example.com',
            institution: 'UCM',
            tariff: 'A'
        }));
    });
});
