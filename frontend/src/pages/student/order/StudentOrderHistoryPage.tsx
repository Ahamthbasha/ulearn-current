import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EntityTable from "../../../components/common/EntityTable";
import { allOrder } from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { useDebounce } from "../../../hooks/UseDebounce";
import { type DisplayOrder, type OrderHistory } from "../interface/studentInterface";

export default function StudentOrderHistoryPage() {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 500);
  const pageSize = 5;
  const navigate = useNavigate();

  const fetchOrders = async (page: number = currentPage, search: string = "", status: string = "") => {
    try {
      setLoading(true);
      
      // Combine search query and status filter - prioritize status
      const finalSearchQuery = status || search;
      
      const res = await allOrder(page, pageSize, finalSearchQuery);
      
      const formattedOrders: DisplayOrder[] = res.orders.map((order: OrderHistory) => ({
        ...order,
        formattedAmount: `₹${order.finalPrice.toFixed(2)}`,
        statusDisplay: order.status.toUpperCase(),
      }));
      
      setOrders(formattedOrders);
      setTotalOrders(res.total);
    } catch (error: any) {
      console.error("Fetch orders error:", error);
      toast.error(error.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Effect for initial load and page changes without search/filter
  useEffect(() => {
    if (!searchQuery && !statusFilter) {
      fetchOrders(currentPage);
    }
  }, [currentPage]);

  // Effect for search and filter changes
  useEffect(() => {
    if (debouncedSearch !== "" || statusFilter !== "") {
      setCurrentPage(1);
      fetchOrders(1, debouncedSearch, statusFilter);
    } else {
      fetchOrders(currentPage);
    }
  }, [debouncedSearch, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setStatusFilter(""); // Clear status filter when typing
    setIsSearching(true);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setSearchQuery(""); // Clear text search when selecting status
    setCurrentPage(1);
    setIsSearching(true);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
    setIsSearching(false);
    fetchOrders(1, "", "");
  };

  const handleView = (order: DisplayOrder) => {
    navigate(`/user/order/${order.orderId}`);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getFilterStatusText = () => {
    if (statusFilter) {
      return `Showing ${statusFilter.toUpperCase()} orders`;
    }
    if (searchQuery) {
      return `Search results for "${searchQuery}"`;
    }
    return "";
  };

  const columns = [
    {
      key: "orderId" as keyof DisplayOrder,
      label: "Order ID",
      render: (value: string) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
          {value.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "formattedAmount" as keyof DisplayOrder,
      label: "Amount",
    },
    {
      key: "orderDate" as keyof DisplayOrder,
      label: "Date",
    },
    {
      key: "statusDisplay" as keyof DisplayOrder,
      label: "Status",
      render: (value: string, row: DisplayOrder) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(row.status)}`}
        >
          {value}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white px-4 py-8 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
          My Order History
        </h1>

        {/* Search and Filter Bar */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by Order ID..."
                disabled={!!statusFilter}
                className={`w-full pl-10 pr-10 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-all duration-200 ${
                  statusFilter ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
                }`}
              />

              {/* Search Icon */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Clear Button */}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                  title="Clear search"
                >
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                disabled={!!searchQuery}
                className={`w-full sm:w-[140px] px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base transition-all duration-200 ${
                  searchQuery ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
                }`}
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Clear All Filters Button */}
            {(searchQuery || statusFilter) && (
              <button
                onClick={handleClearFilters}
                className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm sm:text-base"
                title="Clear all filters"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Filter Status Display */}
          {(searchQuery || statusFilter) && (
            <div className="text-xs sm:text-sm text-gray-600 flex items-center">
              {isSearching ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Searching...
                </span>
              ) : (
                <span>
                  {getFilterStatusText()} - 
                  {totalOrders > 0
                    ? ` Found ${totalOrders} order${totalOrders > 1 ? "s" : ""}`
                    : " No orders found"}
                </span>
              )}
            </div>
          )}
        </div>

        {loading && !isSearching ? (
          <div className="flex justify-center items-center py-12 sm:py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-gray-500 text-sm sm:text-base">Loading your orders...</span>
            </div>
          </div>
        ) : (
          <EntityTable<DisplayOrder>
            title={
              statusFilter
                ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Orders`
                : searchQuery
                ? `Search Results`
                : "Order History"
            }
            data={orders}
            columns={columns}
            actionLabel="View Details"
            onAction={handleView}
            emptyText={
              statusFilter
                ? `No ${statusFilter} orders found.`
                : searchQuery
                ? `No orders found matching "${searchQuery}". Try searching with a different Order ID.`
                : "No orders yet. Your orders will appear here once you make a purchase."
            }
            pagination={{
              currentPage,
              totalItems: totalOrders,
              pageSize,
              onPageChange: setCurrentPage,
            }}
          />
        )}
      </div>
    </div>
  );
}