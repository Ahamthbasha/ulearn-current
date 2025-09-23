import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, Search, Filter, ChevronDown, X } from "lucide-react";
import { adminGetAllWithdrawalRequests } from "../../../api/action/AdminActionApi";
import { useDebounce } from "../../../hooks/UseDebounce";
import { type WithdrawalRequestDto, type StatusFilter } from "../interface/adminInterface";
import DataTable,{type Column,type ActionButton,type PaginationProps} from "../../../components/AdminComponents/DataTable";

export default function AdminWithdrawalPage() {
  const navigate = useNavigate();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequestDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const limit = 10;

  const fetchWithdrawalRequests = async (pageNum = 1, search = "", status: StatusFilter = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetAllWithdrawalRequests(pageNum, limit, search, status);
      setWithdrawalRequests(res.transactions || []);
      setPage(res.currentPage || 1);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to load withdrawal requests";
      setError(errorMessage);
      toast.error(errorMessage);
      setWithdrawalRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
    setPage(1);
    setIsDropdownOpen(false);
  };

  const handlePageChange = (pageNum: number) => {
    setPage(pageNum);
  };

  const handleViewDetails = (record: WithdrawalRequestDto) => {
    navigate(`/admin/withdrawals/${record.requestId}`);
  };

  const handleRetry = () => {
    fetchWithdrawalRequests(page, searchTerm, statusFilter);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPage(1);
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
    if (isMobileSearchOpen && searchTerm) {
      setSearchTerm("");
    }
  };

  // Trigger search whenever debounced term changes
  useEffect(() => {
    fetchWithdrawalRequests(1, debouncedSearchTerm, statusFilter);
  }, [debouncedSearchTerm]);

  // Trigger fetch when status filter changes
  useEffect(() => {
    fetchWithdrawalRequests(1, debouncedSearchTerm, statusFilter);
  }, [statusFilter]);

  // Trigger page change fetch
  useEffect(() => {
    fetchWithdrawalRequests(page, debouncedSearchTerm, statusFilter);
  }, [page]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "completed":
        return "inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200";
      case "rejected":
        return "inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200";
      case "pending":
        return "inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200";
      default:
        return "inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getBankAccountColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "linked":
        return "inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200";
      case "not linked":
        return "inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200";
      default:
        return "inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getSearchDescription = () => {
    let description = `Showing ${total} withdrawal requests`;
    
    if (statusFilter) {
      description += ` with status "${statusFilter}"`;
    }
    
    if (searchTerm) {
      description += ` matching "${searchTerm}"`;
    }
    
    return description;
  };

  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  const getSelectedStatusLabel = () => {
    const selected = statusOptions.find(option => option.value === statusFilter);
    return selected ? selected.label : "All Status";
  };

  // Ultra-responsive columns optimized for all screen sizes
  const columns: Column<WithdrawalRequestDto>[] = [
    {
      key: "instructorDetails",
      title: "Instructor",
      minWidth: "120px",
      priority: 1,
      render: (_, record) => (
        <div className="flex flex-col space-y-0.5">
          <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px] lg:max-w-[200px]" title={record.instructorName}>
            {record.instructorName}
          </span>
          <span className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-[150px] lg:max-w-[200px]" title={record.instructorEmail}>
            {record.instructorEmail}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      width: "70px",
      minWidth: "60px",
      priority: 2,
      render: (value) => (
        <div className="text-right">
          <span className="font-bold text-green-600 text-xs sm:text-sm whitespace-nowrap block">
            ₹{value?.toLocaleString('en-IN') || '0'}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: "80px",
      minWidth: "70px",
      priority: 2,
      render: (value) => (
        <div className="flex justify-center">
          <span className={getStatusColor(value)}>
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 flex-shrink-0 ${
              value?.toLowerCase() === 'approved' ? 'bg-green-500' : 
              value?.toLowerCase() === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="hidden xs:hidden sm:inline truncate">{value}</span>
            <span className="xs:inline sm:hidden font-bold">{value?.charAt(0)}</span>
          </span>
        </div>
      ),
    },
    {
      key: "bankAccount",
      title: "Bank",
      width: "70px",
      minWidth: "60px",
      priority: 3,
      render: (value) => (
        <div className="flex justify-center">
          <span className={getBankAccountColor(value)}>
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 flex-shrink-0 ${value?.toLowerCase() === 'linked' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="hidden xs:hidden sm:inline">{value}</span>
            <span className="xs:inline sm:hidden font-bold">{value === 'Linked' ? 'L' : 'N'}</span>
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      title: "Date",
      width: "90px",
      minWidth: "80px",
      priority: 4,
      render: (value) => (
        <div className="text-center">
          <span className="text-xs text-gray-600 whitespace-nowrap block">
            {/* Parse and format date for better mobile display */}
            {(() => {
              try {
                // Handle the format "18/08/2025 04:40 PM"
                const [datePart, timePart, period] = value.split(' ');
                const [day, month, year] = datePart.split('/');
                return (
                  <div className="flex flex-col">
                    <span className="text-xs">{`${day}/${month}/${year.slice(-2)}`}</span>
                    <span className="text-xs text-gray-400 hidden sm:block">{`${timePart} ${period}`}</span>
                  </div>
                );
              } catch {
                return <span className="text-xs">{value}</span>;
              }
            })()}
          </span>
        </div>
      ),
    },
  ];

  // Compact responsive actions
  const actions: ActionButton<WithdrawalRequestDto>[] = [
    {
      key: "view",
      label: (record) => `View details for ${record.instructorName}`,
      icon: <Eye size={12} className="sm:w-4 sm:h-4" />,
      onClick: handleViewDetails,
      className: "bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-200 min-w-[28px] min-h-[28px] sm:min-w-[32px] sm:min-h-[32px]",
    },
  ];

  // Pagination props
  const pagination: PaginationProps = {
    currentPage: page,
    totalPages: totalPages,
    onPageChange: handlePageChange,
  };

  // Compact status filter dropdown
  const StatusFilterDropdown = () => (
    <div className="relative dropdown-container">
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative w-full sm:w-auto bg-white border border-gray-300 rounded-lg shadow-sm px-2 sm:px-3 py-1.5 sm:py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm min-w-[100px] sm:min-w-[140px] transition-all duration-200 hover:bg-gray-50"
      >
        <div className="flex items-center">
          <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2 flex-shrink-0" />
          <span className="block truncate font-medium text-xs sm:text-sm">{getSelectedStatusLabel()}</span>
          <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-400 ml-1 sm:ml-2 flex-shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isDropdownOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none border">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusFilterChange(option.value)}
              className={`w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-100 transition-colors ${
                statusFilter === option.value
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option.label}</span>
                {statusFilter === option.value && (
                  <span className="text-blue-600 font-bold">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Compact active filters component
  const ActiveFilters = () => {
    if (!statusFilter && !searchTerm) return null;

    return (
      <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 lg:p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <span className="font-medium">Active filters:</span>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {statusFilter && (
                <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  Status: {statusFilter}
                  <button
                    onClick={() => handleStatusFilterChange("")}
                    className="ml-1 sm:ml-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  Search: "{searchTerm.length > 15 ? searchTerm.slice(0, 15) + '...' : searchTerm}"
                  <button
                    onClick={() => handleSearchChange("")}
                    className="ml-1 sm:ml-1.5 text-green-600 hover:text-green-800 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={clearFilters}
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Clear all filters
          </button>
        </div>
      </div>
    );
  };

  // Ultra-compact left side header content
  const leftSideHeaderContent = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 lg:gap-3 w-full sm:w-auto">
      {/* Mobile Search Toggle */}
      <div className="flex sm:hidden">
        <button
          onClick={toggleMobileSearch}
          className="flex items-center justify-center p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors min-w-[32px] min-h-[32px]"
          aria-label="Toggle search"
        >
          {isMobileSearchOpen ? <X size={16} /> : <Search size={16} />}
        </button>
      </div>

      {/* Mobile Search Input */}
      {isMobileSearchOpen && (
        <div className="flex sm:hidden w-full">
          <input
            type="text"
            placeholder="Search instructor..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs"
            autoFocus
          />
        </div>
      )}

      {/* Status Filter Dropdown */}
      <StatusFilterDropdown />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-1 sm:p-2 lg:p-4">
      <div className="max-w-full mx-auto">
        <ActiveFilters />
        <DataTable
          data={withdrawalRequests}
          columns={columns}
          loading={loading}
          error={error}
          title="Withdrawal Requests"
          description={getSearchDescription()}
          actions={actions}
          onRetry={handleRetry}
          pagination={pagination}
          searchValue={isMobileSearchOpen ? "" : searchTerm}
          onSearchChange={!isMobileSearchOpen ? handleSearchChange : undefined}
          searchPlaceholder="Search instructor name, email..."
          leftSideHeaderContent={leftSideHeaderContent}
          emptyStateIcon={<Search className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-300" />}
          emptyStateTitle={searchTerm || statusFilter ? "No results found" : "No withdrawal requests"}
          emptyStateDescription={
            searchTerm || statusFilter 
              ? "No withdrawal requests found for the current filters. Try adjusting your search terms or filters."
              : "No withdrawal requests have been submitted yet."
          }
        />
      </div>
    </div>
  );
}