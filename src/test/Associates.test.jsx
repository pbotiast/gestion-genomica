import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Associates from '../pages/Associates';
import { useAppContext } from '../context/AppContext';

// Mock fetching
global.fetch = vi.fn();

const mockResearchers = [
    { id: 1, fullName: 'Dr. House' },
    { id: 2, fullName: 'Dr. Strange' }
];

// Mock AppContext
vi.mock('../context/AppContext', () => ({
    useAppContext: vi.fn(),
}));

describe('Associates Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation
        useAppContext.mockReturnValue({
            researchers: mockResearchers,
            associates: [],
            addAssociate: vi.fn(),
            deleteAssociate: vi.fn(),
            updateAssociate: vi.fn(),
            addTechnician: vi.fn(),
            technicians: []
        });
    });

    it('renders empty state when no associates', () => {
        render(<Associates />);
        expect(screen.getByText(/No se encontraron resultados/i)).toBeInTheDocument();
    });

    it('renders list of associates', () => {
        const mockAssociates = [
            { id: 1, name: 'Juan Perez', researcherId: 1, email: 'juan@test.com' }
        ];

        useAppContext.mockReturnValue({
            researchers: mockResearchers,
            associates: mockAssociates,
            addAssociate: vi.fn(),
            deleteAssociate: vi.fn(),
            updateAssociate: vi.fn(),
            addTechnician: vi.fn(),
            technicians: []
        });

        render(<Associates />);

        const juanElements = screen.getAllByText('Juan Perez');
        expect(juanElements.length).toBeGreaterThan(0);
        expect(juanElements[0]).toBeInTheDocument();

        const drHouseElements = screen.getAllByText('Dr. House');
        expect(drHouseElements.length).toBeGreaterThan(0);
        expect(drHouseElements[0]).toBeInTheDocument();
    });

    it('adds a new associate manually via modal', async () => {
        const mockAdd = vi.fn();
        useAppContext.mockReturnValue({
            researchers: mockResearchers,
            associates: [],
            addAssociate: mockAdd,
            deleteAssociate: vi.fn(),
            updateAssociate: vi.fn(),
            addTechnician: vi.fn(),
            technicians: []
        });

        render(<Associates />);

        // Open modal
        const newBtn = screen.getByText('Nueva Vinculación');
        fireEvent.click(newBtn);

        // Wait for modal to open and find inputs
        await screen.findByRole('heading', { name: "Nueva Vinculación" });

        const inputName = screen.getByPlaceholderText(/Ej: Perez, Juan/i);
        const inputEmail = screen.getByPlaceholderText(/usuario@ucm.es/i);
        const selectRes = screen.getByRole('combobox');

        fireEvent.change(inputName, { target: { value: 'Maria Lopez' } });
        fireEvent.change(inputEmail, { target: { value: 'maria@test.com' } });
        fireEvent.change(selectRes, { target: { value: '2' } });

        const saveBtn = screen.getByText('Guardar Usuario');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(mockAdd).toHaveBeenCalledWith("2", "Maria Lopez", "maria@test.com");
        });
    });
});
