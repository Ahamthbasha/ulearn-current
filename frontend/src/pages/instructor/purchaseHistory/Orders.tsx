// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { membershipPurchaseHistory } from "../../../api/action/InstructorActionApi";
// import EntityTable from "../../../components/common/EntityTable";
// import { toast } from "react-toastify";

// interface MembershipPlan {
//   name: string;
//   durationInDays: number;
// }

// interface MembershipOrder {
//   membershipPlanId: MembershipPlan;
//   price: number;
//   paymentStatus: "pending" | "paid";
//   txnId: string;
//   startDate: string;
//   endDate: string;
//   createdAt: string;
// }

// const Orders = () => {
//   const [orders, setOrders] = useState<MembershipOrder[]>([]);
//   const [total, setTotal] = useState(0);
//   const [page, setPage] = useState(1);
//   const [limit] = useState(10);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchOrders = async () => {
//     try {
//       setLoading(true);
//       const { data, total } = await membershipPurchaseHistory(page, limit);
//       setOrders(data || []);
//       setTotal(total || 0);
//     } catch (err) {
//       toast.error("Failed to fetch order history");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOrders();
//   }, [page]);

//   const columns = [
//     {
//       key: "membershipPlanId" as keyof MembershipOrder,
//       label: "Plan Name",
//       render: (value: any) => value?.name || "-",
//     },
//     {
//       key: "price" as keyof MembershipOrder,
//       label: "Amount (₹)",
//     },
//     {
//       key: "paymentStatus" as keyof MembershipOrder,
//       label: "Status",
//       render: (status: string) =>
//         status === "paid" ? (
//           <span className="text-green-600 font-medium">Paid</span>
//         ) : (
//           <span className="text-yellow-600 font-medium">Pending</span>
//         ),
//     },
//   ];

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold mb-4">Membership Purchase History</h2>

//       {loading ? (
//         <p className="text-gray-600">Loading...</p>
//       ) : (
//         <EntityTable
//           title="Your Membership Orders"
//           data={orders}
//           columns={columns}
//           actionLabel="View"
//           onAction={(order) =>
//             navigate(`/instructor/membershipOrders/${order.txnId}`)
//           }
//           emptyText="No membership purchases found."
//           pagination={{
//             currentPage: page,
//             totalItems: total,
//             pageSize: limit,
//             onPageChange: (p) => setPage(p),
//           }}
//         />
//       )}
//     </div>
//   );
// };

// export default Orders;














































import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { membershipPurchaseHistory } from "../../../api/action/InstructorActionApi";
import EntityTable from "../../../components/common/EntityTable";
import { toast } from "react-toastify";
import { useDebounce } from "../../../hooks/UseDebounce"; // Import the debounce hook

// Interface for the backend response
interface MembershipOrder {
  orderId: string;
  planName: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  purchaseDate: string;
}

// Interface for display purposes with formatted values
interface DisplayOrder extends MembershipOrder {
  formattedAmount: string;
  formattedDate: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // Debounce search query
  const navigate = useNavigate();

  // Helper function to format date as DD-MM-YYYY
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, total } = await membershipPurchaseHistory(page, limit, debouncedSearchQuery);

      // Transform data with formatted values
      const formattedOrders: DisplayOrder[] = (data || []).map((order: MembershipOrder) => ({
        ...order,
        formattedAmount: `₹${order.amount.toFixed(2)}`,
        formattedDate: formatDate(order.purchaseDate),
      }));

      setOrders(formattedOrders);
      setTotal(total || 0);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to fetch order history");
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, debouncedSearchQuery]); // Use debounced search query

  const columns = [
    {
      key: "orderId" as keyof DisplayOrder,
      label: "Order ID",
    },
    {
      key: "planName" as keyof DisplayOrder,
      label: "Plan Name",
    },
    {
      key: "formattedAmount" as keyof DisplayOrder,
      label: "Amount",
    },
    {
      key: "status" as keyof DisplayOrder,
      label: "Status",
      render: (status: string) =>
        status === "paid" ? (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Paid
          </span>
        ) : status === "pending" ? (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            Pending
          </span>
        ) : (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Failed
          </span>
        ),
    },
    {
      key: "formattedDate" as keyof DisplayOrder,
      label: "Purchase Date",
    },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Membership Purchase History</h2>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search by Order ID or Plan Name..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Search Info */}
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Searching for: "<span className="font-medium">{searchQuery}</span>"
              {total > 0 && <span> - {total} result{total !== 1 ? "s" : ""} found</span>}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      ) : (
        <EntityTable
          title="Your Membership Orders"
          data={orders}
          columns={columns}
          actionLabel="View Details"
          onAction={(order) => navigate(`/instructor/membershipOrders/${order.orderId}`)}
          emptyText={
            searchQuery
              ? `No orders found matching "${searchQuery}"`
              : "No membership purchases found."
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
  );
};

export default Orders;