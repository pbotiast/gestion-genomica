import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Requests from '../pages/Requests';
import * as AppContextModule from '../context/AppContext';

// Mock AppContext
const mockAppContext = {
    requests: [],
    updateRequestStatus: vi.fn(),
    createRequest: vi.fn(),
    updateRequest: vi.fn(),
    researchers: [],
    services: [],
    technicians: []
};

vi.mock('../context/AppContext', () => ({
    useAppContext: () => mockAppContext
}));

describe('Requests Page Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue(mockAppContext);
        // Mock confirm
        global.confirm = vi.fn(() => true);
    });

    it('renders list of requests', () => {
        mockAppContext.requests = [
            { id: 1, registrationNumber: '2024-00001', researcherName: 'Dr. House', status: 'pending' }
        ];

        render(<Requests />);

        expect(screen.getByText('2024-00001')).toBeInTheDocument();
        expect(screen.getByText('Dr. House')).toBeInTheDocument();
    });

    it('shows finalize button for pending requests', () => {
        mockAppContext.requests = [
            { id: 1, registrationNumber: '2024-00001', status: 'pending' }
        ];

        render(<Requests />);

        // Check for Send icon button (title "Finalizar y Enviar a Facturación")
        const finalizeBtn = screen.getByTitle('Finalizar y Enviar a Facturación');
        expect(finalizeBtn).toBeInTheDocument();
    });

    it('calls updateRequestStatus when finalizing', async () => {
        mockAppContext.requests = [
            { id: 1, registrationNumber: '2024-00001', status: 'pending' }
        ];

        render(<Requests />);

        const finalizeBtn = screen.getByTitle('Finalizar y Enviar a Facturación');
        fireEvent.click(finalizeBtn);

        expect(global.confirm).toHaveBeenCalled();
        expect(mockAppContext.updateRequestStatus).toHaveBeenCalledWith(1, 'processed');
    });

    it('shows edit modal when edit button clicked', () => {
        mockAppContext.requests = [
            {
                id: 1,
                registrationNumber: '2024-00001',
                status: 'pending',
                researcherId: 1,
                serviceId: 1
            }
        ];

        render(<Requests />);

        const editBtn = screen.getByTitle('Editar Solicitud');
        fireEvent.click(editBtn);

        expect(screen.getByText('Editar Solicitud')).toBeInTheDocument();
    });
});
