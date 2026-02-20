import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DataTable from './DataTable';

describe('DataTable', () => {
    const mockColumns = [
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            accessorKey: 'email',
            header: 'Email',
        },
        {
            accessorKey: 'age',
            header: 'Age',
        },
    ];

    const mockData = [
        { name: 'John Doe', email: 'john@example.com', age: 30 },
        { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
        { name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
    ];

    it('renders table with correct columns and data', () => {
        render(<DataTable columns={mockColumns} data={mockData} />);

        // Check headers
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();

        // Check data
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        expect(screen.getByText('35')).toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
        render(<DataTable columns={mockColumns} data={[]} />);

        expect(screen.getByText(/no se encontraron resultados/i)).toBeInTheDocument();
    });

    it('handles sorting when clicking headers', () => {
        render(<DataTable columns={mockColumns} data={mockData} />);

        const nameHeader = screen.getByText('Name').closest('div');

        // First click - ascending
        fireEvent.click(nameHeader);
        const rows = screen.getAllByRole('row');
        // Bob, Jane, John alphabetically
        expect(rows[1]).toHaveTextContent('Bob Johnson');

        // Second click - descending
        fireEvent.click(nameHeader);
        const rowsDesc = screen.getAllByRole('row');
        expect(rowsDesc[1]).toHaveTextContent('John Doe');
    });

    it('filters data based on global filter', () => {
        const mockOnFilterChange = vi.fn();

        render(
            <DataTable
                columns={mockColumns}
                data={mockData}
                globalFilter=""
                onGlobalFilterChange={mockOnFilterChange}
            />
        );

        // Initially shows all 3 rows
        expect(screen.getAllByRole('row')).toHaveLength(4); // header + 3 data rows
    });

    it('handles pagination correctly', () => {
        const largeData = Array.from({ length: 25 }, (_, i) => ({
            name: `User ${i}`,
            email: `user${i}@example.com`,
            age: 20 + i,
        }));

        render(<DataTable columns={mockColumns} data={largeData} pageSize={10} />);

        // Should show only 10 items on first page
        expect(screen.getByText('User 0')).toBeInTheDocument();
        expect(screen.getByText('User 9')).toBeInTheDocument();
        expect(screen.queryByText('User 10')).not.toBeInTheDocument();

        // Check pagination info
        expect(screen.getByText(/Página/i)).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('navigates between pages', () => {
        const largeData = Array.from({ length: 25 }, (_, i) => ({
            name: `User ${i}`,
            email: `user${i}@example.com`,
            age: 20 + i,
        }));

        render(<DataTable columns={mockColumns} data={largeData} pageSize={10} />);

        // Click next button
        const nextButton = screen.getAllByRole('button').find(btn =>
            btn.querySelector('svg') && !btn.disabled && btn.textContent === ''
        );

        if (nextButton) {
            fireEvent.click(nextButton);

            // Should show items from page 2
            expect(screen.getByText('User 10')).toBeInTheDocument();
            expect(screen.queryByText('User 0')).not.toBeInTheDocument();
        }
    });

    it('allows changing page size', () => {
        const largeData = Array.from({ length: 50 }, (_, i) => ({
            name: `User ${i}`,
            email: `user${i}@example.com`,
            age: 20 + i,
        }));

        render(<DataTable columns={mockColumns} data={largeData} pageSize={10} />);

        const pageSizeSelect = screen.getByRole('combobox');

        // Change to 20 items per page
        fireEvent.change(pageSizeSelect, { target: { value: '20' } });

        // Now should show 20 items
        expect(screen.getByText('User 0')).toBeInTheDocument();
        expect(screen.getByText('User 19')).toBeInTheDocument();
    });

    it('calls onRowClick when row is clicked', () => {
        const mockOnRowClick = vi.fn();

        render(
            <DataTable
                columns={mockColumns}
                data={mockData}
                onRowClick={mockOnRowClick}
            />
        );

        const firstRow = screen.getByText('John Doe').closest('tr');
        fireEvent.click(firstRow);

        expect(mockOnRowClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('displays correct pagination stats', () => {
        const data = Array.from({ length: 15 }, (_, i) => ({
            name: `User ${i}`,
            email: `user${i}@example.com`,
            age: 20 + i,
        }));

        render(<DataTable columns={mockColumns} data={data} pageSize={10} />);

        expect(screen.getByText(/15 resultados/i)).toBeInTheDocument();
        expect(screen.getByText(/Página/i)).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });
});
