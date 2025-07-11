import React from 'react';
import { X } from 'lucide-react';

export interface Column<T = any> {
  key: string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
}

export interface ActionButton<T = any> {
  key: string;
  label: string | ((record: T) => string);
  icon: React.ReactNode | ((record: T) => React.ReactNode);
  onClick: (record: T) => void;
  className?: string | ((record: T) => string);
  condition?: (record: T) => boolean;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string | null;
  title: string;
  description?: string;
  actions?: ActionButton<T>[];
  onRetry?: () => void;
  emptyStateIcon?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  pagination?: PaginationProps;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  leftSideHeaderContent?: React.ReactNode;
}

const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error = null,
  title,
  description,
  actions = [],
  onRetry,
  emptyStateIcon,
  emptyStateTitle = "No data available",
  emptyStateDescription = "No records have been added yet.",
  pagination,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  leftSideHeaderContent,
}: DataTableProps<T>) => {
  const resolveValue = <K,>(value: K | ((record: T) => K), record: T): K => {
    return typeof value === 'function' ? (value as (record: T) => K)(record) : value;
  };

  if (error) {
    return (
      <div className="min-h-screen p-4 lg:p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="pt-12 lg:pt-0">
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <X size={32} className="text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Data</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 pt-12 lg:pt-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-blue-600">{title}</h1>
              {description && <p className="text-gray-600 text-sm">{description}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {onSearchChange && (
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              )}
              {leftSideHeaderContent && leftSideHeaderContent}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ width: column.width }}
                    >
                      {column.title}
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                        <p>Loading...</p>
                      </div>
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((record, index) => (
                    <tr key={record.id || index} className="hover:bg-gray-50 transition-colors">
                      {columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                          {column.render 
                            ? column.render(record[column.key], record, index)
                            : <span className="text-sm text-gray-900">{record[column.key]}</span>
                          }
                        </td>
                      ))}
                      {actions.length > 0 && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {actions.map((action) => {
                              const shouldShow = action.condition ? action.condition(record) : true;
                              if (!shouldShow) return null;
                              const label = resolveValue(action.label, record);
                              const icon = resolveValue(action.icon, record);
                              const className = resolveValue(action.className || 'bg-blue-500 hover:bg-blue-600 text-white', record);
                              return (
                                <button
                                  key={action.key}
                                  onClick={() => action.onClick(record)}
                                  className={`inline-flex items-center justify-center p-2 rounded-full transition-all duration-200 hover:scale-110 ${className}`}
                                  title={label}
                                >
                                  {icon}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        {emptyStateIcon && <div className="mb-4">{emptyStateIcon}</div>}
                        <p className="text-lg font-medium mb-1">{emptyStateTitle}</p>
                        <p className="text-sm">{emptyStateDescription}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => pagination.onPageChange(pageNumber)}
                      className={`px-3 py-1 rounded transition-colors ${
                        pageNumber === pagination.currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataTable;
