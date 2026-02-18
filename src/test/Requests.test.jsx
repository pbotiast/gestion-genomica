import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Requests from '../pages/Requests';

// Mock AppContext
vi.mock('../context/AppContext', () => ({
    useAppContext: vi.fn(),
}));

vi.mock('@react-pdf/renderer', () => ({
    PDFDownloadLink: vi.fn(({ children }) => <div>{children({ loading: false })}</div>),
    Document: vi.fn(({ children }) => <div>{children}</div>),
    Page: vi.fn(({ children }) => <div>{children}</div>),
    Text: vi.fn(({ children }) => <div>{children}</div>),
    View: vi.fn(({ children }) => <div>{children}</div>),
    StyleSheet: { create: vi.fn() },
}));

vi.mock('../components/pdf/RequestPDF', () => ({
    default: () => <div>PDF Content</div>
}));

import { useAppContext } from '../context/AppContext';

// Mock data
const mockAppContext = {
    requests: [],
    updateRequestStatus: vi.fn(),
    createRequest: vi.fn(),
    updateRequest: vi.fn(),
    deleteRequest: vi.fn(),
    researchers: [],
    services: [],
    technicians: [],
    associates: [],
    formats: []
};

describe('Requests Page Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock return
        useAppContext.mockReturnValue(mockAppContext);
        // Mock confirm
        window.confirm = vi.fn(() => true);
    });

    it('renders list of requests', () => {
        mockAppContext.requests = [
            { id: 1, registrationNumber: '2024-00001', researcherName: 'Dr. House', status: 'pending' }
        ];

        render(<Requests />);

        // Handle possible duplicate renders (desktop/mobile)
        expect(screen.getAllByText('2024-00001')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Dr. House')[0]).toBeInTheDocument();
    });


    it('shows finalize button for completed requests', () => {
        mockAppContext.requests = [
            { id: 1, registrationNumber: '2024-00001', status: 'completed' }
        ];

        render(<Requests />);

        // Check for Send icon button (title "Facturar")
        const finalizeBtn = screen.getAllByTitle('Facturar')[0];
        expect(finalizeBtn).toBeInTheDocument();
    });

    it('calls updateRequestStatus when finalizing', async () => {
        mockAppContext.requests = [
            { id: 1, registrationNumber: '2024-00001', status: 'completed' }
        ];

        render(<Requests />);

        const finalizeBtn = screen.getAllByTitle('Facturar')[0];
        fireEvent.click(finalizeBtn);

        expect(window.confirm).toHaveBeenCalled();
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

        const editBtn = screen.getByTitle('Editar');
        fireEvent.click(editBtn);

        expect(screen.getByText('Editar Solicitud')).toBeInTheDocument();
    });
});

