import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { membershipPurchaseHistory } from "../../../api/action/InstructorActionApi";
import EntityTable from "../../../components/common/EntityTable";
import { toast } from "react-toastify";
import { useDebounce } from "../../../hooks/UseDebounce";
import { type DisplayOrder, type MembershipOrder} from "../interface/instructorInterface";
import type { ApiError } from "../../../types/interfaces/ICommon";

const Orders = () => {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const navigate = useNavigate();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchOrders = async (currentPage: number = page, search: string = "", status: string = "") => {
    try {
      setLoading(true);

      const finalSearchQuery = status || search;

      const { data, total } = await membershipPurchaseHistory(currentPage, limit, finalSearchQuery);

      const formattedOrders: DisplayOrder[] = (data || []).map((order: MembershipOrder) => ({
        ...order,
        formattedAmount: `₹${order.amount.toFixed(2)}`,
        formattedDate: formatDate(order.purchaseDate),
        statusDisplay: order.status.toUpperCase(),
      }));

      setOrders(formattedOrders);
      setTotal(total || 0);
    } catch (err) {
      const error = err as ApiError;
      console.error("Error fetching orders:", error);
      
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message ||
        "Failed to fetch order history";
      
      toast.error(errorMessage);
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!searchQuery && !statusFilter) {
      fetchOrders(page);
    }
  }, [page]);

  useEffect(() => {
    if (debouncedSearchQuery !== "" || statusFilter !== "") {
      setPage(1);
      fetchOrders(1, debouncedSearchQuery, statusFilter);
    } else {
      fetchOrders(page);
    }
  }, [debouncedSearchQuery, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setStatusFilter("");
    setPage(1);
    setIsSearching(true);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setSearchQuery("");
    setPage(1);
    setIsSearching(true);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setPage(1);
    setIsSearching(false);
    fetchOrders(1, "", "");
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-600";
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
      render: (value: unknown) => (
        <span className="font-mono text-xs sm:text-sm bg-gray-100 px-2 sm:px-3 py-1 rounded truncate">
          {typeof value === 'string' && value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-8)}` : String(value)}
        </span>
      ),
    },
    {
      key: "planName" as keyof DisplayOrder,
      label: "Plan Name",
      render: (value: unknown) => (
        <span className="font-medium text-gray-900 text-sm sm:text-base">{String(value)}</span>
      ),
    },
    {
      key: "formattedAmount" as keyof DisplayOrder,
      label: "Amount",
      render: (value: unknown) => (
        <span className="font-semibold text-green-600 text-sm sm:text-base">{String(value)}</span>
      ),
    },
    {
      key: "statusDisplay" as keyof DisplayOrder,
      label: "Status",
      render: (value: unknown, row: DisplayOrder) => (
        <span
          className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusBadgeColor(row.status)}`}
        >
          {String(value)}
        </span>
      ),
    },
    {
      key: "formattedDate" as keyof DisplayOrder,
      label: "Purchase Date",
      render: (value: unknown) => (
        <span className="text-sm sm:text-base">{String(value)}</span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
          Membership Purchase History
        </h1>

        {/* Search and Filter Bar */}
        <div className="mb-4 sm:mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by Order ID or Plan Name..."
                disabled={!!statusFilter}
                className={`w-full pl-10 pr-10 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  statusFilter ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
                }`}
              />
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

            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                disabled={!!searchQuery}
                className={`w-full sm:w-36 md:w-40 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-colors ${
                  searchQuery ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
                }`}
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {(searchQuery || statusFilter) && (
              <button
                onClick={handleClearFilters}
                className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                title="Clear all filters"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
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

          {(searchQuery || statusFilter) && (
            <div className="text-xs sm:text-sm text-gray-600">
              {isSearching ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2"
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
                  {total > 0
                    ? ` Found ${total} order${total > 1 ? "s" : ""}`
                    : " No orders found"}
                </span>
              )}
            </div>
          )}
        </div>

        {loading && !isSearching ? (
          <div className="flex justify-center items-center py-10 sm:py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
              <span className="text-sm sm:text-base text-gray-500">Loading membership orders...</span>
            </div>
          </div>
        ) : (
          <EntityTable<DisplayOrder>
            title={
              statusFilter
                ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Membership Orders`
                : searchQuery
                ? `Search Results`
                : "Your Membership Orders"
            }
            data={orders}
            columns={columns}
            actionLabel="View Details"
            onAction={(order) => navigate(`/instructor/membershipOrders/${order.orderId}`)}
            emptyText={
              statusFilter
                ? `No ${statusFilter} membership orders found.`
                : searchQuery
                ? `No orders found matching "${searchQuery}". Try searching with a different Order ID or Plan Name.`
                : "No membership purchases found. Your membership orders will appear here."
            }
            pagination={{
              currentPage: page,
              totalItems: total,
              pageSize: limit,
              onPageChange: (p) => setPage(p),
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Orders;