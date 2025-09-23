import { useEffect, useState } from "react";
import { bookingHistory } from "../../../api/action/StudentAction";
import EntityTable from "../../../components/common/EntityTable";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDebounce } from "../../../hooks/UseDebounce";
import { type SlotOrderHistory } from "../interface/studentInterface";

const PAGE_SIZE = 5;

const SlotHistoryPage = () => {
  const [orders, setOrders] = useState<SlotOrderHistory[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Get debounced value from custom hook
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchOrders = async (page: number, search = "", status = "") => {
    try {
      setLoading(true);
      
      // Combine search query and status filter
      let combinedQuery = "";
      if (status) {
        combinedQuery = status;
      } else if (search) {
        combinedQuery = search;
      }

      const res = await bookingHistory(page, PAGE_SIZE, combinedQuery);
      console.log("API Response:", res);

      // Transform the data to match the expected structure
      const transformedOrders = res.data.map((order: any) => ({
        orderId: order.orderId,
        date: `${order.date} ${order.startTime} - ${order.endTime}`,
        amount: order.price,
        gateway: order.gateway || "N/A",
        status: order.status || "confirmed",
      }));

      setOrders(transformedOrders);
      setTotalOrders(res.total || 0);
    } catch (error: any) {
      console.error("Fetch orders error:", error);
      toast.error(error.response?.data?.message || "Failed to load order history");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Effect to fetch when page changes (non-search)
  useEffect(() => {
    if (!searchQuery && !statusFilter) {
      fetchOrders(currentPage);
    }
  }, [currentPage]);

  // Effect to fetch when search input (debounced) changes
  useEffect(() => {
    if (debouncedSearchQuery !== "" || statusFilter !== "") {
      setCurrentPage(1);
      fetchOrders(1, debouncedSearchQuery, statusFilter);
    } else {
      fetchOrders(currentPage);
    }
  }, [debouncedSearchQuery, statusFilter]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setStatusFilter(""); // Clear status filter when typing
    setIsSearching(true);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setSearchQuery(""); // Clear text search when selecting status
    setCurrentPage(1);
    setIsSearching(true);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
    setIsSearching(false);
    fetchOrders(1, "", "");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns = [
    {
      key: "orderId" as keyof SlotOrderHistory,
      label: "Order ID",
      render: (value: string) => (
        <span className="font-mono text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded break-all">
          {value.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "date" as keyof SlotOrderHistory,
      label: "Date & Time",
      render: (value: string) => (
        <div className="text-xs sm:text-sm">
          <div className="font-medium text-gray-900">{value.split(' ')[0]}</div>
          <div className="text-gray-500">{value.split(' ').slice(1).join(' ')}</div>
        </div>
      ),
    },
    {
      key: "amount" as keyof SlotOrderHistory,
      label: "Amount",
      render: (value: number) => (
        <span className="font-semibold text-green-600 text-sm sm:text-base">
          ₹{value || 0}
        </span>
      ),
    },
    {
      key: "status" as keyof SlotOrderHistory,
      label: "Status",
      render: (value: string) => {
        const status = value || "confirmed";
        const statusConfig = {
          confirmed: "bg-green-100 text-green-800 border-green-200",
          failed: "bg-red-100 text-red-800 border-red-200",
        };
        
        const statusClass = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.confirmed;
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusClass} inline-flex items-center`}>
            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              status.toLowerCase() === 'confirmed' ? 'bg-green-500' :
              status.toLowerCase() === 'failed' ? 'bg-red-500' :
              status.toLowerCase() === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
            }`}></div>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
  ];

  const handleViewDetails = (order: SlotOrderHistory) => {
    navigate(`/user/slotHistory/${order.orderId}`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order History</h1>
                <p className="text-sm text-gray-500 mt-1">View and manage your booking history</p>
              </div>
            </div>
            
            {/* Stats Card - Mobile Hidden, Desktop Visible */}
            <div className="hidden sm:flex bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalOrders}</div>
                <div className="text-xs text-blue-600 font-medium">Total Orders</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col space-y-4">
              {/* Search and Filter Controls */}
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Orders
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search by Order ID..."
                      disabled={!!statusFilter}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        statusFilter ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"
                      }`}
                    />
                    
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                        title="Clear search"
                      >
                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="lg:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    disabled={!!searchQuery}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      searchQuery ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"
                    }`}
                  >
                    <option value="">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                {(searchQuery || statusFilter) && (
                  <div className="lg:self-end">
                    <button
                      onClick={handleClearFilters}
                      className="w-full lg:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 font-medium"
                      title="Clear all filters"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Clear Filters</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Filter Status Display */}
              {(searchQuery || statusFilter) && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {isSearching ? (
                        <span className="flex items-center">
                          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Searching...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          {getFilterStatusText()} - 
                          {totalOrders > 0
                            ? ` Found ${totalOrders} order${totalOrders > 1 ? "s" : ""}`
                            : " No orders found"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Section */}
        {loading && !isSearching ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <span className="text-gray-500 text-lg">Loading your orders...</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <EntityTable
              title={
                statusFilter
                  ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Orders`
                  : searchQuery
                  ? `Search Results`
                  : "Your Orders"
              }
              data={orders}
              columns={columns}
              onAction={handleViewDetails}
              actionLabel="View Details"
              emptyText={
                statusFilter
                  ? `No ${statusFilter} orders found. Try adjusting your filters.`
                  : searchQuery
                  ? `No orders found matching "${searchQuery}". Try searching with a different Order ID.`
                  : "No orders found yet. Your order history will appear here once you make your first booking!"
              }
              pagination={{
                currentPage,
                totalItems: totalOrders,
                pageSize: PAGE_SIZE,
                onPageChange: handlePageChange,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotHistoryPage;