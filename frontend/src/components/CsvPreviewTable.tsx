'use client';

import { useMemo, useRef, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface CsvPreviewTableProps {
  data: Record<string, string>[];
  columns: string[];
}

export function CsvPreviewTable({ data, columns }: CsvPreviewTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');

  const columnDefs: ColumnDef<Record<string, string>>[] = useMemo(
    () =>
      columns.map((col, i) => ({
        id: `col_${i}`,
        accessorKey: col,
        header: col || `Column ${i + 1}`,
        cell: (info) => {
          const value = info.getValue() as string;
          return (
            <span className="text-sm truncate block max-w-[200px]" title={value}>
              {value || '-'}
            </span>
          );
        },
        size: 150,
        minSize: 100,
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    defaultColumn: { size: 150, minSize: 100 },
  });

  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h3 className="text-lg font-semibold">Preview ({rows.length} rows)</h3>
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search across all columns..."
          className="w-full sm:w-80 px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>

      <div className="relative">
        {data.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No data to display
          </div>
        ) : (
          <div
            ref={(el) => { tableContainerRef.current = el; }}
            className="border border-[var(--border)] rounded-lg overflow-auto max-h-[500px] scrollbar-thin"
          >
            <div style={{ minWidth: columns.length * 150 }}>
              {/* Sticky header */}
              <div className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--border)]">
                <div className="flex">
                  <div className="w-12 min-w-[48px] px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider bg-[var(--muted)] border-r border-[var(--border)] sticky left-0 z-20">
                    #
                  </div>
                  {table.getHeaderGroups().map((headerGroup) =>
                    headerGroup.headers.map((header) => (
                      <div
                        key={header.id}
                        className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider bg-[var(--muted)] border-r border-[var(--border)] truncate"
                        style={{ minWidth: header.getSize(), width: header.getSize() }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Virtualized rows */}
              <div
                style={{ height: totalSize, position: 'relative' }}
              >
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <div
                      key={row.id}
                      className="flex border-b border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: virtualRow.size,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div className="w-12 min-w-[48px] px-2 py-2 text-xs text-gray-500 flex items-center bg-[var(--background)] border-r border-[var(--border)] sticky left-0 z-10">
                        {virtualRow.index + 1}
                      </div>
                      {row.getVisibleCells().map((cell) => (
                        <div
                          key={cell.id}
                          className="px-3 py-2 border-r border-[var(--border)] flex items-center"
                          style={{
                            minWidth: cell.column.getSize(),
                            width: cell.column.getSize(),
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
