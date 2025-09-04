import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    pageSize: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
  };
  sorting?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  };
  filtering?: {
    filters?: Record<string, any>;
    onFilter?: (filters: Record<string, any>) => void;
  };
  selection?: {
    selectedRows?: T[];
    onSelectionChange?: (selectedRows: T[]) => void;
    rowKey?: keyof T | string;
  };
  className?: string;
  rowClassName?: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  filtering,
  selection,
  className,
  rowClassName,
  onRowClick
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
  const [sortBy, setSortBy] = useState(sorting?.sortBy || '');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(sorting?.sortOrder || 'asc');
  const [selectedRows, setSelectedRows] = useState<T[]>(selection?.selectedRows || []);
  const [filters, setFilters] = useState<Record<string, any>>(filtering?.filters || {});

  // Filter data
  const filteredData = useMemo(() => {
    if (!filtering) return data;
    
    return data.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = row[key];
        return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
      });
    });
  }, [data, filters, filtering]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortBy, sortOrder]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnKey: string) => {
    const newSortOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnKey);
    setSortOrder(newSortOrder);
    sorting?.onSort?.(columnKey, newSortOrder);
  };

  const handleFilter = (columnKey: string, value: any) => {
    const newFilters = { ...filters, [columnKey]: value };
    setFilters(newFilters);
    filtering?.onFilter?.(newFilters);
    setCurrentPage(1);
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    const rowKey = selection?.rowKey || 'id';
    const key = row[rowKey as keyof T];
    
    let newSelectedRows;
    if (checked) {
      newSelectedRows = [...selectedRows, row];
    } else {
      newSelectedRows = selectedRows.filter(r => r[rowKey as keyof T] !== key);
    }
    
    setSelectedRows(newSelectedRows);
    selection?.onSelectionChange?.(newSelectedRows);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedRows = checked ? paginatedData : [];
    setSelectedRows(newSelectedRows);
    selection?.onSelectionChange?.(newSelectedRows);
  };

  const isRowSelected = (row: T) => {
    const rowKey = selection?.rowKey || 'id';
    const key = row[rowKey as keyof T];
    return selectedRows.some(r => r[rowKey as keyof T] === key);
  };

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(isRowSelected);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      {filtering && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
          {columns
            .filter(col => col.filterable)
            .map(col => (
              <div key={String(col.key)} className="flex flex-col gap-1">
                <label className="text-sm font-medium">{col.title}</label>
                <input
                  type="text"
                  placeholder={`Filtrar ${col.title.toLowerCase()}...`}
                  value={filters[String(col.key)] || ''}
                  onChange={(e) => handleFilter(String(col.key), e.target.value)}
                  className="h-8 px-3 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
    />
  </div>
            ))}
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {selection && (
                  <th className="w-12 p-3 text-left">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-input"
                    />
                  </th>
                )}
                {columns.map(col => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      "p-3 text-left font-medium text-muted-foreground",
                      col.sortable && "cursor-pointer hover:text-foreground transition-colors",
                      col.align === 'center' && "text-center",
                      col.align === 'right' && "text-right"
                    )}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                  >
                    <div className="flex items-center gap-2">
                      {col.title}
                      {col.sortable && (
                        <div className="flex flex-col">
                          <svg
                            className={cn(
                              "h-3 w-3 transition-colors",
                              sortBy === col.key && sortOrder === 'asc' ? "text-primary" : "text-muted-foreground/50"
                            )}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                          <svg
    className={cn(
                              "h-3 w-3 -mt-1 transition-colors",
                              sortBy === col.key && sortOrder === 'desc' ? "text-primary" : "text-muted-foreground/50"
                            )}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (selection ? 1 : 0)} className="p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Cargando datos...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selection ? 1 : 0)} className="p-8 text-center text-muted-foreground">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={index}
    className={cn(
                      "border-b border-border hover:bg-muted/50 transition-colors",
                      onRowClick && "cursor-pointer",
                      rowClassName?.(row, index)
                    )}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {selection && (
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isRowSelected(row)}
                          onChange={(e) => handleSelectRow(row, e.target.checked)}
                          className="rounded border-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td
                        key={String(col.key)}
                        className={cn(
                          "p-3",
                          col.align === 'center' && "text-center",
                          col.align === 'right' && "text-right"
                        )}
                      >
                        {col.render ? col.render(row[col.key as keyof T], row, index) : row[col.key as keyof T]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length} resultados
            </span>
            {pagination.showSizeChanger && (
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-input rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Primera
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-input rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            {pagination.showQuickJumper && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="w-16 h-8 px-2 text-sm border border-input rounded-md text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">de {totalPages}</span>
              </div>
            )}
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-input rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-input rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Última
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { Table };