import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EntityTable from "../../../components/common/EntityTable";
import { allOrder } from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { useDebounce } from "../../../hooks/UseDebounce";

interface Order {
  orderId: string;
  amount: number;
  gateway: string;
  date: string; 
}

interface DisplayOrder extends Order {
  formattedAmount: string;
  formattedGateway: string;
}

export default function StudentOrderHistoryPage() {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const pageSize = 5;

  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await allOrder(currentPage, pageSize, debouncedSearch);
      const formattedOrders: DisplayOrder[] = res.orders.map((order: Order) => ({
        ...order,
        formattedAmount: `₹${order.amount.toFixed(2)}`,
        formattedGateway: order.gateway.toUpperCase(),
      }));
      setOrders(formattedOrders);
      setTotalOrders(res.total);
    } catch (error) {
      toast.error("Failed to load orders");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, debouncedSearch]);

  const handleView = (order: DisplayOrder) => {
    navigate(`/user/order/${order.orderId}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">My Orders</h1>

      {/* 🔍 Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Order ID"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded w-full md:w-1/3"
        />
      </div>

      <EntityTable<DisplayOrder>
        title="Order History"
        data={orders}
        columns={[
          { key: "orderId", label: "Order ID" },
          { key: "formattedAmount", label: "Amount" },
          { key: "formattedGateway", label: "Gateway" },
          { key: "date", label: "Date" },
        ]}
        actionLabel="View"
        onAction={handleView}
        emptyText="No orders yet."
        pagination={{
          currentPage,
          totalItems: totalOrders,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  );
}
