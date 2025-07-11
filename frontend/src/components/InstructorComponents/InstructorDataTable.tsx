import React from "react";
import { X } from "lucide-react";

export interface InstructorColumn<T = any> {
  key: string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
}

export interface InstructorActionButton<T = any> {
  key: string;
  label: string | ((record: T) => string);
  icon: React.ReactNode | ((record: T) => React.ReactNode);
  onClick: (record: T) => void;
  className?: string | ((record: T) => string);
  condition?: (record: T) => boolean;
}

export interface InstructorDataTableProps<T = any> {
  data: T[];
  columns: InstructorColumn<T>[];
  loading?: boolean;
  error?: string | null;
  title: string;
  description?: string;
  actions?: InstructorActionButton<T>[];
  onRetry?: () => void;
  emptyStateIcon?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;

  // pagination and search
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

const InstructorDataTable = <T extends Record<string, any>>({
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

  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showSearch = false,
  searchValue = "",
  onSearchChange,
}: InstructorDataTableProps<T>) => {
  const resolveValue = <K,>(value: K | ((record: T) => K), record: T): K => {
    return typeof value === "function" ? (value as (record: T) => K)(record) : value;
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">{title}</h2>
          {description && <p className="text-gray-600 text-sm">{description}</p>}
        </div>
        {showSearch && onSearchChange && (
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border border-gray-300 px-3 py-1 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        )}
      </div>

      {error ? (
        <div className="bg-white shadow rounded p-6 border border-red-200 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X size={24} className="text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Error loading data</h2>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {col.title}
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: "140px" }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    Loading...
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((record, index) => (
                  <tr key={record._id || index} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis"
                      >
                        {col.render
                          ? col.render(record[col.key], record, index)
                          : <span className="text-sm text-gray-900">{record[col.key]}</span>}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {actions.map((action) => {
                            const show = action.condition ? action.condition(record) : true;
                            if (!show) return null;
                            const icon = resolveValue(action.icon, record);
                            const label = resolveValue(action.label, record);
                            const className = resolveValue(
                              action.className || "bg-blue-500 hover:bg-blue-600 text-white",
                              record
                            );
                            return (
                              <button
                                key={action.key}
                                onClick={() => action.onClick(record)}
                                className={`p-2 rounded-full ${className}`}
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
                      <p className="text-lg font-semibold mb-1">{emptyStateTitle}</p>
                      <p className="text-sm">{emptyStateDescription}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && data.length > 0 && totalPages > 1 && onPageChange && (
        <div className="flex justify-center mt-6 gap-2">
  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
    <button
      key={pageNum}
      onClick={() => onPageChange(pageNum)}
      className={`px-3 py-1 border rounded ${
        pageNum === currentPage ? "bg-blue-500 text-white" : ""
      }`}
    >
      {pageNum}
    </button>
  ))}
</div>

      )}
    </div>
  );
};

export default InstructorDataTable;
