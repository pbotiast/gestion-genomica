import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResearcherForm from './ResearcherForm';

describe('ResearcherForm', () => {
    it('renders correctly', () => {
        render(<ResearcherForm onSubmit={() => { }} onCancel={() => { }} />);
        expect(screen.getByText(/Datos Personales/i)).toBeInTheDocument();
        expect(screen.getByText(/Centro/i)).toBeInTheDocument();
    });

    // Valid test if logic existed, but currently removed/not implemented
    // it('updates tariff automatically based on institution', () => { ... }); 

    it('submits form data with auto-added associate', async () => {
        const handleSubmit = vi.fn((data) => console.log('SUBMITTED DATA:', JSON.stringify(data, null, 2)));
        render(<ResearcherForm onSubmit={handleSubmit} onCancel={() => { }} />);

        fireEvent.change(screen.getByLabelText(/Nombre y Apellidos/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '123456789' } });
        fireEvent.change(screen.getByLabelText(/CIF \/ NIF/i), { target: { value: '12345678A' } });
        fireEvent.change(screen.getByLabelText(/Centro/i), { target: { value: 'UCM' } });

        // Tariff is manual now
        fireEvent.change(screen.getByRole('combobox', { name: /Tarifa Asignada/i }), { target: { value: 'A' } });

        fireEvent.change(screen.getByLabelText(/Dirección Fiscal/i), { target: { value: 'Street 1' } });
        fireEvent.change(screen.getByLabelText(/Dirección Envío/i), { target: { value: 'Street 2' } });

        // Wait for auto-added associate to appear in the list (ensures useEffect ran)
        await screen.findByText(/John Doe/i, { selector: 'li span' }); // More specific selector if needed, or just partial text

        fireEvent.click(screen.getByText(/Guardar Investigador/i));

        expect(handleSubmit).toHaveBeenCalled();
        expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({
            fullName: 'John Doe',
            email: 'john@example.com',
            institution: 'UCM',
            tariff: 'A',
            associates: expect.arrayContaining([
                expect.objectContaining({
                    name: 'John Doe',
                    email: 'john@example.com',
                    isPrincipal: true
                })
            ])
        }));
    });
});
