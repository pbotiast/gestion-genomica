import React from 'react';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Professional Data Table Component with sorting, filtering, and pagination
 * Built with @tanstack/react-table v8
 */
const DataTable = ({
    columns,
    data,
    globalFilter,
    onGlobalFilterChange,
    pageSize = 10,
    className = '',
    onRowClick,
    meta,
}) => {
    const [sorting, setSorting] = React.useState([]);
    const [columnFilters, setColumnFilters] = React.useState([]);
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: pageSize,
    });

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            pagination,
        },
        meta,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className={cn('w-full', className)}>
            {/* Table Container */}
            <div className="overflow-hidden border border-gray-200 rounded-lg">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th
                                            key={header.id}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={cn(
                                                        'flex items-center gap-2',
                                                        header.column.getCanSort() && 'cursor-pointer select-none hover:text-gray-700'
                                                    )}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getCanSort() && (
                                                        <span className="ml-auto">
                                                            {header.column.getIsSorted() === 'asc' ? (
                                                                <ChevronUp size={16} className="text-indigo-600" />
                                                            ) : header.column.getIsSorted() === 'desc' ? (
                                                                <ChevronDown size={16} className="text-indigo-600" />
                                                            ) : (
                                                                <ChevronsUpDown size={16} className="text-gray-400" />
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        No se encontraron resultados
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map(row => (
                                    <tr
                                        key={row.id}
                                        className={cn(
                                            'hover:bg-gray-50 transition-colors',
                                            onRowClick && 'cursor-pointer'
                                        )}
                                        onClick={() => onRowClick?.(row.original)}
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <td
                                                key={cell.id}
                                                className="px-6 py-4 text-sm text-gray-700"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {table.getPageCount() > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 rounded-b-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span>
                            Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de{' '}
                            <strong>{table.getPageCount()}</strong>
                        </span>
                        <span className="text-gray-500">
                            ({table.getFilteredRowModel().rows.length} resultados)
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={table.getState().pagination.pageSize}
                            onChange={e => table.setPageSize(Number(e.target.value))}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            {[10, 20, 30, 50].map(size => (
                                <option key={size} value={size}>
                                    Mostrar {size}
                                </option>
                            ))}
                        </select>

                        <div className="flex gap-1">
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className={cn(
                                    'p-2 rounded-md transition-colors',
                                    table.getCanPreviousPage()
                                        ? 'text-gray-700 hover:bg-gray-100'
                                        : 'text-gray-300 cursor-not-allowed'
                                )}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className={cn(
                                    'p-2 rounded-md transition-colors',
                                    table.getCanNextPage()
                                        ? 'text-gray-700 hover:bg-gray-100'
                                        : 'text-gray-300 cursor-not-allowed'
                                )}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Memoize to prevent unnecessary re-renders
export default React.memo(DataTable);
