import { Pencil, Trash2 } from "lucide-react";
import { type ReactNode } from "react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

interface EntityTableProps<T> {
  title: string;
  data: T[];
  columns: {
    key: keyof T;
    label: string;
    render?: (value: any, row: T) => ReactNode;
  }[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onAction?: (item: T) => void;
  actionLabel?: string;
  emptyText?: string;
  pagination?: PaginationProps;
}

const EntityTable = <T,>({
  title,
  data,
  columns,
  onEdit,
  onDelete,
  onAction,
  actionLabel = "View",
  emptyText = "No data available",
  pagination,
}: EntityTableProps<T>) => {
  const totalPages = pagination ? Math.ceil(pagination.totalItems / pagination.pageSize) : 0;

  return (
    <div className="mt-6 w-full">
      {title && <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>}

      {data.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{emptyText}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border shadow-sm bg-white">
            <table className="min-w-full text-sm text-left text-gray-800">
              <thead className="bg-gray-100">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key as string}
                      className="px-6 py-3 font-semibold text-gray-700 whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                  {(onEdit || onDelete || onAction) && (
                    <th className="px-6 py-3 font-semibold text-gray-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key as string} className="px-6 py-4 whitespace-nowrap">
                        {col.render ? col.render(item[col.key], item) : (item[col.key] as ReactNode)}
                      </td>
                    ))}
                    {(onEdit || onDelete || onAction) && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-3 items-center">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          {onAction && (
                            <button
                              onClick={() => onAction(item)}
                              className="text-blue-500 hover:underline text-sm font-medium"
                            >
                              {actionLabel}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Numbered Pagination */}
          {pagination && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`px-3 py-1 border rounded-md transition text-sm ${
                    pagination.currentPage === pageNum
                      ? "bg-blue-600 text-white font-semibold"
                      : "bg-white hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EntityTable;