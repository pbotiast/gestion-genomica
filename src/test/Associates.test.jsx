import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Associates from '../pages/Associates';
import { AppProvider } from '../context/AppContext';

// Mock fetching
global.fetch = vi.fn();

const mockResearchers = [
    { id: 1, fullName: 'Dr. House' },
    { id: 2, fullName: 'Dr. Strange' }
];

// Mock AppContext to provide researchers
vi.mock('../context/AppContext', async () => {
    const actual = await vi.importActual('../context/AppContext');
    return {
        ...actual,
        useAppContext: () => ({
            researchers: mockResearchers,
            addTechnician: vi.fn(),
            technicians: []
        })
    };
});

describe('Associates Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty state when no associates', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        render(<Associates />);

        expect(screen.getByText(/Cargando vinculaciones/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/No hay usuarios autorizados registrados/i)).toBeInTheDocument();
        });
    });

    it('renders list of associates', async () => {
        const mockAssociates = [
            { id: 1, name: 'Juan Perez', researcherId: 1, email: 'juan@test.com' }
        ];

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAssociates
        });

        render(<Associates />);

        await waitFor(() => {
            expect(screen.getByText('Juan Perez')).toBeInTheDocument();
            expect(screen.getByText('Dr. House')).toBeInTheDocument();
        });
    });

    it('adds a new associate manually', async () => {
        // Initial load empty
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        render(<Associates />);

        await waitFor(() => {
            expect(screen.getByText(/No hay usuarios autorizados/i)).toBeInTheDocument();
        });

        // Fill form
        const inputName = screen.getByPlaceholderText(/Ej: Perez, Juan/i);
        const selectRes = document.querySelector('select'); // Simple selector for now

        fireEvent.change(inputName, { target: { value: 'Maria Lopez' } });
        fireEvent.change(selectRes, { target: { value: '2' } });

        // Mock add response
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 2, name: 'Maria Lopez', researcherId: 2 })
        });

        // Mock refresh fetch
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 2, name: 'Maria Lopez', researcherId: 2 }]
        });

        const addBtn = screen.getByText('Añadir');
        fireEvent.click(addBtn);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/researchers/2/associates'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ name: 'Maria Lopez' })
                })
            );
        });

        // Should refresh list (we mocked the second fetch to return the item)
        // In real component, it calls fetchLinks again.
    });
});
