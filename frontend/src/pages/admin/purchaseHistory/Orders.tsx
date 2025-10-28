import React, { useEffect, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getMembershipPurchaseHistory } from "../../../api/action/AdminActionApi";
import { useDebounce } from "../../../hooks/UseDebounce";
import DataTable, {
  type Column,
  type ActionButton,
  type PaginationProps,
} from "../../../components/AdminComponents/DataTable";
import { type MembershipOrderDTO } from "../interface/adminInterface";

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<MembershipOrderDTO[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const debouncedSearch = useDebounce(searchTerm, 1000);
  const limit = 5;

  // Updated status options including "cancelled"
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "paid", label: "Paid" },
    { value: "failed", label: "Failed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const fetchOrders = async (pageNum = 1, search = "", status: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMembershipPurchaseHistory(
        pageNum,
        limit,
        search,
        status
      );

      setOrders(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(Math.ceil((res.total || 0) / limit));
      setPage(pageNum);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch orders";
      setError(errorMessage);
      toast.error(errorMessage);
      setOrders([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePageChange = (pageNum: number) => {
    setPage(pageNum);
  };

  const handleViewDetails = (record: MembershipOrderDTO) => {
    navigate(`/admin/membershipPurchase/${record.orderId}`);
  };

  const handleRetry = () => {
    fetchOrders(page, searchTerm, statusFilter);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPage(1);
  };

  useEffect(() => {
    fetchOrders(page, debouncedSearch, statusFilter);
  }, [page, debouncedSearch, statusFilter]);

  // Updated getStatusColor to include "cancelled"
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium capitalize border border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium capitalize border border-red-200";
      case "cancelled":
        return "bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium capitalize border border-orange-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium capitalize border border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium capitalize border border-gray-200";
    }
  };

  const getSearchDescription = () => {
    let description = `Showing ${total} membership purchase${total !== 1 ? 's' : ''}`;
    if (searchTerm) {
      description += ` matching "${searchTerm}"`;
    }
    if (statusFilter) {
      description += ` with status "${statusFilter}"`;
    }
    return description;
  };

  const columns: Column<MembershipOrderDTO>[] = [
    { 
      key: "orderId", 
      title: "Order ID", 
      minWidth: "140px",
      hideOnMobile: false,
      render: (value) => (
        <span className="text-xs sm:text-sm font-mono text-gray-900 break-all max-w-[100px] sm:max-w-none truncate" title={value}>
          {value}
        </span>
      )
    },
    { 
      key: "instructorName", 
      title: "Instructor", 
      minWidth: "120px",
      hideOnMobile: false,
      render: (value) => (
        <span className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none" title={value}>
          {value}
        </span>
      )
    },
    { 
      key: "membershipName", 
      title: "Membership", 
      minWidth: "120px",
      hideOnMobile: true,
      render: (value) => (
        <span className="text-sm text-gray-900 truncate" title={value}>
          {value}
        </span>
      )
    },
    {
      key: "price",
      title: "Price",
      width: "80px",
      minWidth: "70px",
      hideOnMobile: false,
      render: (value) => (
        <span className="font-semibold text-green-600 text-xs sm:text-sm whitespace-nowrap">
          ₹{Number(value).toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: "90px",
      minWidth: "80px",
      hideOnMobile: false,
      render: (value) => (
        <span className={getStatusColor(value)}>{value}</span>
      ),
    },
  ];

  const actions: ActionButton<MembershipOrderDTO>[] = [
    {
      key: "view",
      label: "View Details",
      icon: <Eye size={16} />,
      onClick: handleViewDetails,
      className: "bg-blue-500 hover:bg-blue-600 text-white transition-colors",
    },
  ];

  const pagination: PaginationProps = {
    currentPage: page,
    totalPages: totalPages,
    onPageChange: handlePageChange,
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Membership Purchase History
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">
            {getSearchDescription()}
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
            <span className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0">
              Filter by Status:
            </span>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusFilterChange(option.value)}
                  className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 flex items-center ${
                    statusFilter === option.value
                      ? option.value === "paid"
                        ? "bg-green-500 text-white shadow-md"
                        : option.value === "failed"
                        ? "bg-red-500 text-white shadow-md"
                        : option.value === "cancelled"
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                  }`}
                >
                  {option.label}
                  {statusFilter === option.value && option.value !== "" && (
                    <X
                      size={12}
                      className="ml-1.5 cursor-pointer hover:text-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusFilterChange("");
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || statusFilter) && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-blue-200">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                <span className="font-medium flex-shrink-0">Active filters:</span>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      Search: "{searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}"
                      <button
                        onClick={() => handleSearchChange("")}
                        className="ml-1.5 text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full p-0.5"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {statusFilter && (
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${
                      statusFilter === "paid"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : statusFilter === "failed"
                        ? "bg-red-100 text-red-800 border-red-200"
                        : statusFilter === "cancelled"
                        ? "bg-orange-100 text-orange-800 border-orange-200"
                        : "bg-blue-100 text-blue-800 border-blue-200"
                    }`}>
                      Status: "{statusFilter}"
                      <button
                        onClick={() => handleStatusFilterChange("")}
                        className={`ml-1.5 rounded-full p-0.5 ${
                          statusFilter === "paid"
                            ? "text-green-600 hover:text-green-800 hover:bg-green-200"
                            : statusFilter === "failed"
                            ? "text-red-600 hover:text-red-800 hover:bg-red-200"
                            : statusFilter === "cancelled"
                            ? "text-orange-600 hover:text-orange-800 hover:bg-orange-200"
                            : "text-blue-600 hover:text-blue-800 hover:bg-blue-200"
                        }`}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={clearAllFilters}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors self-start sm:self-auto"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* DataTable */}
        <DataTable
          data={orders}
          columns={columns}
          loading={loading}
          error={error}
          title="Membership Purchase History"
          description={getSearchDescription()}
          actions={actions}
          onRetry={handleRetry}
          emptyStateIcon={<Search className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300" />}
          emptyStateTitle={
            searchTerm || statusFilter ? "No results found" : "No orders found"
          }
          emptyStateDescription={
            searchTerm || statusFilter
              ? "No orders match the current filters. Try adjusting your search terms or status filter."
              : "No membership purchases have been made yet."
          }
          pagination={pagination}
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by order ID or instructor..."
        />
      </div>
    </div>
  );
};

export default Orders;