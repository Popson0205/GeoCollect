// portal/src/components/AttributeTable.tsx
// Filterable, sortable, paginated attribute table using @tanstack/react-table.
'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table';

interface Props { features: GeoJSON.Feature[] }

export default function AttributeTable({ features }: Props) {
  const [sorting, setSorting]         = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const keys = Array.from(
      new Set(features.flatMap(f => Object.keys(f.properties || {})))
    ).filter(k => !k.startsWith('_'));

    return [
      { accessorKey: 'id', header: 'ID', size: 200 },
      ...keys.map(k => ({ accessorKey: k, header: k })),
    ];
  }, [features]);

  const data = useMemo(() =>
    features.map(f => ({ id: f.id, ...f.properties })),
    [features]
  );

  const table = useReactTable({
    data, columns, state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 100 } },
  });

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <input
        value={globalFilter}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="Filter all columns..."
        className="w-64 px-3 py-1.5 text-sm border rounded-md"
      />
      <div className="overflow-auto flex-1 border rounded-lg">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className="px-3 py-2 text-left font-medium text-gray-600 cursor-pointer select-none whitespace-nowrap border-b">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === 'asc' ? ' ↑' : h.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-blue-50 border-b">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-1.5 text-gray-700 whitespace-nowrap max-w-xs truncate">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
          className="px-2 py-1 border rounded disabled:opacity-40">← Prev</button>
        <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
          className="px-2 py-1 border rounded disabled:opacity-40">Next →</button>
        <span className="ml-auto">{table.getFilteredRowModel().rows.length} rows</span>
      </div>
    </div>
  );
}
