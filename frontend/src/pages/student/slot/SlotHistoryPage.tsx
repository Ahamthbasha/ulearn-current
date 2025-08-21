import { useEffect, useState } from "react";
import { bookingHistory } from "../../../api/action/StudentAction";
import EntityTable from "../../../components/common/EntityTable";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDebounce } from "../../../hooks/UseDebounce"; // ✅ import your custom hook

interface Booking {
  orderId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: "confirmed" | "pending" | "cancelled";
}

const PAGE_SIZE = 5;

const SlotHistoryPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // ✅ Get debounced value from custom hook
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchBookings = async (page: number, search = "") => {
    try {
      setLoading(true);
      const res = await bookingHistory(page, PAGE_SIZE, search);

      console.log("API Response:", res);

      setBookings(res.data || []);
      setTotalBookings(res.total || 0);
    } catch (error: any) {
      console.error("Fetch bookings error:", error);
      toast.error(error.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // ✅ Effect to fetch when page changes (non-search)
  useEffect(() => {
    if (!searchQuery) {
      fetchBookings(currentPage);
    }
  }, [currentPage]);

  // ✅ Effect to fetch when search input (debounced) changes
  useEffect(() => {
    if (debouncedSearchQuery !== "") {
      setCurrentPage(1);
      fetchBookings(1, debouncedSearchQuery);
    } else {
      fetchBookings(currentPage);
    }
  }, [debouncedSearchQuery]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setIsSearching(false);
    fetchBookings(1, "");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns = [
    {
      key: "orderId" as keyof Booking,
      label: "Order ID",
      render: (value: string) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
          {value.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "date" as keyof Booking,
      label: "Date",
      render: (value: string) => value || "N/A",
    },
    {
      key: "startTime" as keyof Booking,
      label: "Start Time",
      render: (value: string) => value || "N/A",
    },
    {
      key: "endTime" as keyof Booking,
      label: "End Time",
      render: (value: string) => value || "N/A",
    },
    {
      key: "price" as keyof Booking,
      label: "Price",
      render: (value: number) => `₹${value || 0}`,
    },
    {
      key: "status" as keyof Booking,
      label: "Status",
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "confirmed"
              ? "bg-green-100 text-green-800"
              : value === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value?.toUpperCase() || "UNKNOWN"}
        </span>
      ),
    },
  ];

  const handleViewDetails = (booking: Booking) => {
    navigate(`/user/slotHistory/${booking.orderId}`);
  };

  return (
    <div className="min-h-screen bg-white px-6 py-10 md:px-20">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          📖 Slot Booking History
        </h1>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by Order ID..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Search Icon */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
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
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                title="Clear search"
              >
                <svg
                  className="h-5 w-5 text-gray-400 hover:text-gray-600"
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

          {/* Search Status */}
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
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
                  {totalBookings > 0
                    ? `Found ${totalBookings} booking${
                        totalBookings > 1 ? "s" : ""
                      } for "${searchQuery}"`
                    : `No bookings found for "${searchQuery}"`}
                </span>
              )}
            </div>
          )}
        </div>

        {loading && !isSearching ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-gray-500">Loading your bookings...</span>
            </div>
          </div>
        ) : (
          <EntityTable
            title={searchQuery ? `Search Results` : "Your Booked Slots"}
            data={bookings}
            columns={columns}
            onAction={handleViewDetails}
            actionLabel="View Details"
            emptyText={
              searchQuery
                ? `No bookings found matching "${searchQuery}". Try searching with a different Order ID.`
                : "No bookings found. Book your first slot to see it here!"
            }
            pagination={{
              currentPage,
              totalItems: totalBookings,
              pageSize: PAGE_SIZE,
              onPageChange: handlePageChange,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SlotHistoryPage;
