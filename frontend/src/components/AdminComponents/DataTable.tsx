// import React from 'react';
// import { X } from 'lucide-react';

// export interface Column<T = any> {
//   key: string;
//   title: string;
//   render?: (value: any, record: T, index: number) => React.ReactNode;
//   width?: string;
//   minWidth?: string;
//   hideOnMobile?: boolean;
//   priority?: number;
// }

// export interface ActionButton<T = any> {
//   key: string;
//   label: string | ((record: T) => string);
//   icon: React.ReactNode | ((record: T) => React.ReactNode);
//   onClick: (record: T) => void;
//   className?: string | ((record: T) => string);
//   condition?: (record: T) => boolean;
// }

// export interface PaginationProps {
//   currentPage: number;
//   totalPages: number;
//   onPageChange: (page: number) => void;
// }

// export interface DataTableProps<T = any> {
//   data: T[];
//   columns: Column<T>[];
//   loading?: boolean;
//   error?: string | null;
//   title: string;
//   description?: string;
//   actions?: ActionButton<T>[];
//   onRetry?: () => void;
//   emptyStateIcon?: React.ReactNode;
//   emptyStateTitle?: string;
//   emptyStateDescription?: string;
//   pagination?: PaginationProps;
//   searchValue?: string;
//   onSearchChange?: (value: string) => void;
//   searchPlaceholder?: string;
//   leftSideHeaderContent?: React.ReactNode;
// }

// const DataTable = <T extends Record<string, any>>({
//   data,
//   columns,
//   loading = false,
//   error = null,
//   title,
//   description,
//   actions = [],
//   onRetry,
//   emptyStateIcon,
//   emptyStateTitle = "No data available",
//   emptyStateDescription = "No records have been added yet.",
//   pagination,
//   searchValue,
//   onSearchChange,
//   searchPlaceholder = "Search...",
//   leftSideHeaderContent,
// }: DataTableProps<T>) => {
//   const resolveValue = <K,>(value: K | ((record: T) => K), record: T): K => {
//     return typeof value === 'function' ? (value as (record: T) => K)(record) : value;
//   };

//   // Get visible columns based on screen size
//   const getVisibleColumns = () => {
//     return columns.filter(col => !col.hideOnMobile);
//   };

//   const visibleColumns = getVisibleColumns();

//   if (error) {
//     return (
//       <div className="min-h-[50vh] p-3 sm:p-4 lg:p-6 bg-gray-50 flex items-center justify-center">
//         <div className="max-w-4xl w-full mx-auto">
//           <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 sm:p-6 text-center">
//             <div className="flex flex-col items-center">
//               <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
//                 <X size={20} className="text-red-500 sm:w-6 sm:h-6" />
//               </div>
//               <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Unable to Load Data</h2>
//               <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">{error}</p>
//               {onRetry && (
//                 <button
//                   onClick={onRetry}
//                   className="px-3 py-2 sm:px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm"
//                 >
//                   Retry
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-[50vh] p-2 sm:p-4 lg:p-6 bg-gray-50">
//       <div className="max-w-7xl mx-auto">
//         {/* Header Section */}
//         <div className="mb-4 sm:mb-6">
//           <div className="flex flex-col gap-3 sm:gap-4">
//             <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
//               <div className="flex flex-col">
//                 <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 leading-tight">{title}</h1>
//                 {description && <p className="text-gray-600 text-xs sm:text-sm mt-1">{description}</p>}
//               </div>
//               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
//                 {onSearchChange && (
//                   <input
//                     type="text"
//                     placeholder={searchPlaceholder}
//                     value={searchValue || ''}
//                     onChange={(e) => onSearchChange(e.target.value)}
//                     className="w-full sm:w-48 md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm"
//                   />
//                 )}
//                 {leftSideHeaderContent && (
//                   <div className="w-full sm:w-auto">{leftSideHeaderContent}</div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Table Section */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//           {/* Mobile Card View (visible on small screens) */}
//           <div className="block sm:hidden">
//             {loading ? (
//               <div className="p-6 text-center">
//                 <div className="flex flex-col items-center">
//                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
//                   <p className="text-sm text-gray-500">Loading...</p>
//                 </div>
//               </div>
//             ) : data.length > 0 ? (
//               <div className="divide-y divide-gray-200">
//                 {data.map((record, index) => (
//                   <div key={record.id || index} className="p-4 space-y-3">
//                     {columns.map((column) => {
//                       const value = column.render 
//                         ? column.render(record[column.key], record, index)
//                         : record[column.key];
                      
//                       return (
//                         <div key={column.key} className="flex justify-between items-start">
//                           <span className="text-xs font-medium text-gray-500 uppercase tracking-wider min-w-0 flex-1">
//                             {column.title}:
//                           </span>
//                           <div className="ml-2 text-sm text-gray-900 text-right min-w-0 flex-1">
//                             {value}
//                           </div>
//                         </div>
//                       );
//                     })}
                    
//                     {actions.length > 0 && (
//                       <div className="flex justify-between items-center pt-2 border-t border-gray-100">
//                         <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Actions:
//                         </span>
//                         <div className="flex space-x-2">
//                           {actions.map((action) => {
//                             const shouldShow = action.condition ? action.condition(record) : true;
//                             if (!shouldShow) return null;
                            
//                             const label = resolveValue(action.label, record);
//                             const icon = resolveValue(action.icon, record);
//                             const className = resolveValue(
//                               action.className || 'bg-blue-500 hover:bg-blue-600 text-white',
//                               record
//                             );
                            
//                             return (
//                               <button
//                                 key={action.key}
//                                 onClick={() => action.onClick(record)}
//                                 className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:scale-105 ${className} min-w-[36px] min-h-[36px]`}
//                                 title={label}
//                                 aria-label={label}
//                               >
//                                 {icon}
//                               </button>
//                             );
//                           })}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="p-6 text-center">
//                 <div className="flex flex-col items-center">
//                   {emptyStateIcon && <div className="mb-3">{emptyStateIcon}</div>}
//                   <p className="text-sm font-medium mb-1 text-gray-900">{emptyStateTitle}</p>
//                   <p className="text-xs text-gray-500">{emptyStateDescription}</p>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Desktop Table View (hidden on small screens) */}
//           <div className="hidden sm:block overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   {visibleColumns.map((column) => (
//                     <th
//                       key={column.key}
//                       className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                       style={{ 
//                         width: column.width, 
//                         minWidth: column.minWidth || '100px'
//                       }}
//                     >
//                       {column.title}
//                     </th>
//                   ))}
//                   {actions.length > 0 && (
//                     <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
//                       Actions
//                     </th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {loading ? (
//                   <tr>
//                     <td colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0)} className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 text-center text-gray-500">
//                       <div className="flex flex-col items-center">
//                         <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500 mb-2"></div>
//                         <p className="text-xs sm:text-sm">Loading...</p>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : data.length > 0 ? (
//                   data.map((record, index) => (
//                     <tr key={record.id || index} className="hover:bg-gray-50 transition-colors">
//                       {visibleColumns.map((column) => (
//                         <td
//                           key={column.key}
//                           className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900"
//                         >
//                           {column.render ? (
//                             column.render(record[column.key], record, index)
//                           ) : (
//                             <span>{record[column.key]}</span>
//                           )}
//                         </td>
//                       ))}
//                       {actions.length > 0 && (
//                         <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
//                           <div className="flex space-x-1 sm:space-x-2">
//                             {actions.map((action) => {
//                               const shouldShow = action.condition ? action.condition(record) : true;
//                               if (!shouldShow) return null;
                              
//                               const label = resolveValue(action.label, record);
//                               const icon = resolveValue(action.icon, record);
//                               const className = resolveValue(
//                                 action.className || 'bg-blue-500 hover:bg-blue-600 text-white',
//                                 record
//                               );
                              
//                               return (
//                                 <button
//                                   key={action.key}
//                                   onClick={() => action.onClick(record)}
//                                   className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:scale-105 ${className} min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px]`}
//                                   title={label}
//                                   aria-label={label}
//                                 >
//                                   {icon}
//                                 </button>
//                               );
//                             })}
//                           </div>
//                         </td>
//                       )}
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0)} className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 text-center text-gray-500">
//                       <div className="flex flex-col items-center">
//                         {emptyStateIcon && <div className="mb-3 sm:mb-4">{emptyStateIcon}</div>}
//                         <p className="text-sm sm:text-base font-medium mb-1">{emptyStateTitle}</p>
//                         <p className="text-xs sm:text-sm">{emptyStateDescription}</p>
//                       </div>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination */}
//           {pagination && pagination.totalPages > 1 && (
//             <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
//               <div className="flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
//                 <button
//                   onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
//                   disabled={pagination.currentPage === 1}
//                   className="px-2 sm:px-3 py-1 sm:py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] sm:min-w-[70px] min-h-[32px] sm:min-h-[36px] text-xs sm:text-sm"
//                 >
//                   Prev
//                 </button>
                
//                 {/* Page Numbers */}
//                 {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, index) => {
//                   const pageNumber = Math.max(1, pagination.currentPage - 2) + index;
//                   if (pageNumber > pagination.totalPages) return null;
                  
//                   return (
//                     <button
//                       key={pageNumber}
//                       onClick={() => pagination.onPageChange(pageNumber)}
//                       className={`px-2 sm:px-3 py-1 sm:py-2 rounded transition-colors min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] text-xs sm:text-sm ${
//                         pageNumber === pagination.currentPage
//                           ? 'bg-blue-600 text-white'
//                           : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
//                       }`}
//                     >
//                       {pageNumber}
//                     </button>
//                   );
//                 })}
                
//                 {pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2 && (
//                   <span className="px-2 py-1 text-gray-600 text-xs sm:text-sm">...</span>
//                 )}
                
//                 <button
//                   onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
//                   disabled={pagination.currentPage === pagination.totalPages}
//                   className="px-2 sm:px-3 py-1 sm:py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] sm:min-w-[70px] min-h-[32px] sm:min-h-[36px] text-xs sm:text-sm"
//                 >
//                   Next
//                 </button>
//               </div>
              
//               {/* Page Info */}
//               <div className="text-center mt-2 text-xs text-gray-500">
//                 Page {pagination.currentPage} of {pagination.totalPages}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DataTable;




















































import React from 'react';
import { X } from 'lucide-react';

export interface Column<T = any> {
  key: string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
  minWidth?: string;
  hideOnMobile?: boolean;
  priority?: number;
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

export interface FilterProps {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
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
  filters?: FilterProps[];
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
  filters = [],
}: DataTableProps<T>) => {
  const resolveValue = <K,>(value: K | ((record: T) => K), record: T): K => {
    return typeof value === 'function' ? (value as (record: T) => K)(record) : value;
  };

  // Get visible columns based on screen size
  const getVisibleColumns = () => {
    return columns.filter(col => !col.hideOnMobile);
  };

  const visibleColumns = getVisibleColumns();

  if (error) {
    return (
      <div className="min-h-[50vh] p-3 sm:p-4 lg:p-6 bg-gray-50 flex items-center justify-center">
        <div className="max-w-4xl w-full mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 sm:p-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <X size={20} className="text-red-500 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Unable to Load Data</h2>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-2 sm:px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] p-2 sm:p-4 lg:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 leading-tight">{title}</h1>
                {description && <p className="text-gray-600 text-xs sm:text-sm mt-1">{description}</p>}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {onSearchChange && (
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full sm:w-48 md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm"
                  />
                )}
                {filters.map((filter) => (
                  <div key={filter.key} className="w-full sm:w-auto">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{filter.label}</label>
                    <select
                      value={filter.value}
                      onChange={(e) => filter.onChange(e.target.value)}
                      className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm"
                    >
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {leftSideHeaderContent && (
                  <div className="w-full sm:w-auto">{leftSideHeaderContent}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Mobile Card View (visible on small screens) */}
          <div className="block sm:hidden">
            {loading ? (
              <div className="p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              </div>
            ) : data.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {data.map((record, index) => (
                  <div key={record.id || index} className="p-4 space-y-3">
                    {columns.map((column) => {
                      const value = column.render 
                        ? column.render(record[column.key], record, index)
                        : record[column.key];
                      
                      return (
                        <div key={column.key} className="flex justify-between items-start">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider min-w-0 flex-1">
                            {column.title}:
                          </span>
                          <div className="ml-2 text-sm text-gray-900 text-right min-w-0 flex-1">
                            {value}
                          </div>
                        </div>
                      );
                    })}
                    
                    {actions.length > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions:
                        </span>
                        <div className="flex space-x-2">
                          {actions.map((action) => {
                            const shouldShow = action.condition ? action.condition(record) : true;
                            if (!shouldShow) return null;
                            
                            const label = resolveValue(action.label, record);
                            const icon = resolveValue(action.icon, record);
                            const className = resolveValue(
                              action.className || 'bg-blue-500 hover:bg-blue-600 text-white',
                              record
                            );
                            
                            return (
                              <button
                                key={action.key}
                                onClick={() => action.onClick(record)}
                                className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:scale-105 ${className} min-w-[36px] min-h-[36px]`}
                                title={label}
                                aria-label={label}
                              >
                                {icon}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="flex flex-col items-center">
                  {emptyStateIcon && <div className="mb-3">{emptyStateIcon}</div>}
                  <p className="text-sm font-medium mb-1 text-gray-900">{emptyStateTitle}</p>
                  <p className="text-xs text-gray-500">{emptyStateDescription}</p>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Table View (hidden on small screens) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ 
                        width: column.width, 
                        minWidth: column.minWidth || '100px'
                      }}
                    >
                      {column.title}
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0)} className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500 mb-2"></div>
                        <p className="text-xs sm:text-sm">Loading...</p>
                      </div>
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((record, index) => (
                    <tr key={record.id || index} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.map((column) => (
                        <td
                          key={column.key}
                          className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900"
                        >
                          {column.render ? (
                            column.render(record[column.key], record, index)
                          ) : (
                            <span>{record[column.key]}</span>
                          )}
                        </td>
                      ))}
                      {actions.length > 0 && (
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex space-x-1 sm:space-x-2">
                            {actions.map((action) => {
                              const shouldShow = action.condition ? action.condition(record) : true;
                              if (!shouldShow) return null;
                              
                              const label = resolveValue(action.label, record);
                              const icon = resolveValue(action.icon, record);
                              const className = resolveValue(
                                action.className || 'bg-blue-500 hover:bg-blue-600 text-white',
                                record
                              );
                              
                              return (
                                <button
                                  key={action.key}
                                  onClick={() => action.onClick(record)}
                                  className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:scale-105 ${className} min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px]`}
                                  title={label}
                                  aria-label={label}
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
                    <td colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0)} className="px-3 sm:px-4 lg:px-6 py-8 sm:py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        {emptyStateIcon && <div className="mb-3 sm:mb-4">{emptyStateIcon}</div>}
                        <p className="text-sm sm:text-base font-medium mb-1">{emptyStateTitle}</p>
                        <p className="text-xs sm:text-sm">{emptyStateDescription}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
                <button
                  onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-2 sm:px-3 py-1 sm:py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] sm:min-w-[70px] min-h-[32px] sm:min-h-[36px] text-xs sm:text-sm"
                >
                  Prev
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, index) => {
                  const pageNumber = Math.max(1, pagination.currentPage - 2) + index;
                  if (pageNumber > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => pagination.onPageChange(pageNumber)}
                      className={`px-2 sm:px-3 py-1 sm:py-2 rounded transition-colors min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] text-xs sm:text-sm ${
                        pageNumber === pagination.currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                {pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2 && (
                  <span className="px-2 py-1 text-gray-600 text-xs sm:text-sm">...</span>
                )}
                
                <button
                  onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-2 sm:px-3 py-1 sm:py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] sm:min-w-[70px] min-h-[32px] sm:min-h-[36px] text-xs sm:text-sm"
                >
                  Next
                </button>
              </div>
              
              {/* Page Info */}
              <div className="text-center mt-2 text-xs text-gray-500">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataTable;