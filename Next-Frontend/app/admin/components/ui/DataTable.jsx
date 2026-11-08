'use client';

import { useState, useMemo } from 'react';
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Tray,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils.js';
import Button from './Button.jsx';

export function DataTable({
  columns = [],
  data = [],
  keyField = '_id',
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  pageSize = 10,
  emptyMessage = 'No records found',
  emptySubMessage = 'Try adjusting your search or filters to find what you are looking for.',
  renderMobileCard,
  actions,
  filterComponent,
  className,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const val = key.split('.').reduce((obj, k) => obj?.[k], item);
          return val && String(val).toLowerCase().includes(term);
        });
      }
      return Object.values(item).some(
        (val) => val && typeof val === 'string' && val.toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKeys]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className={cn('space-y-3.5 w-full font-sans', className)}>
      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-edge-subtle shadow-sm">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-ground border border-edge-subtle rounded-xl text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-amber-700/30 focus:border-amber-700 transition-all font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          {filterComponent}
          {actions}
        </div>
      </div>

      {/* Main Table Container */}
      {paginatedData.length === 0 ? (
        <div className="bg-white rounded-xl border border-edge-subtle p-12 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-ground-sunk flex items-center justify-center text-ink-muted mb-3 border border-edge-subtle">
            <Tray size={24} />
          </div>
          <h4 className="text-sm font-semibold text-ink mb-1">{emptyMessage}</h4>
          <p className="text-xs text-ink-muted max-w-sm">{emptySubMessage}</p>
        </div>
      ) : (
        <>
          {/* Desktop View (Table with fixed layout) */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-edge-subtle bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="border-b border-edge-subtle bg-ground">
                    {columns.map((col, idx) => (
                      <th
                        key={col.key || idx}
                        style={col.width ? { width: col.width } : undefined}
                        className={cn(
                          'py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-ink-secondary font-sans',
                          col.className
                        )}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge-subtle">
                  {paginatedData.map((row, rowIdx) => (
                    <tr
                      key={row[keyField] || rowIdx}
                      className="hover:bg-ground transition-colors"
                    >
                      {columns.map((col, colIdx) => (
                        <td
                          key={col.key || colIdx}
                          className={cn(
                            'py-3.5 px-4 text-xs text-ink font-sans align-middle',
                            col.cellClassName
                          )}
                        >
                          {col.render ? col.render(row) : row[col.key] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3.5 border-t border-edge-subtle bg-ground/60 flex items-center justify-between text-xs text-ink-muted font-sans">
              <span className="tabular-nums">
                Showing{' '}
                <strong className="text-ink font-semibold">
                  {(currentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-ink font-semibold">
                  {Math.min(currentPage * pageSize, filteredData.length)}
                </strong>{' '}
                of{' '}
                <strong className="text-ink font-semibold">
                  {filteredData.length}
                </strong>{' '}
                entries
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 text-xs"
                >
                  <CaretLeft size={14} className="mr-1" /> Previous
                </Button>

                <span className="px-2 font-medium text-ink-secondary tabular-nums">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 text-xs"
                >
                  Next <CaretRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile View (Cards) */}
          <div className="md:hidden space-y-3">
            {paginatedData.map((row, rowIdx) => (
              <div
                key={row[keyField] || rowIdx}
                className="bg-white rounded-xl border border-edge-subtle p-4 shadow-sm"
              >
                {renderMobileCard ? (
                  renderMobileCard(row)
                ) : (
                  <div className="space-y-2">
                    {columns.map((col, idx) => (
                      <div key={col.key || idx} className="flex justify-between text-xs">
                        <span className="font-semibold text-ink-muted">{col.label}</span>
                        <span>{col.render ? col.render(row) : row[col.key]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default DataTable;
