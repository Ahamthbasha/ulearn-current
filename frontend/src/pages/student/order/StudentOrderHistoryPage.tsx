import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EntityTable from "../../../components/common/EntityTable";
import { allOrder } from "../../../api/action/StudentAction";
import { toast } from "react-toastify";

interface Order {
  _id: string;
  amount: number;
  createdAt: string;
  gateway: string;
}

interface DisplayOrder extends Order {
  formattedAmount: string;
  formattedDate: string;
  formattedGateway: string;
}

export default function StudentOrderHistoryPage() {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const pageSize = 5;

  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await allOrder(currentPage, pageSize);
      const formattedOrders: DisplayOrder[] = res.orders.map(
        (order: Order) => ({
          ...order,
          formattedDate: new Date(order.createdAt).toLocaleString(),
          formattedAmount: `₹${order.amount.toFixed(2)}`,
          formattedGateway: order.gateway.toUpperCase(),
        })
      );
      setOrders(formattedOrders);
      setTotalOrders(res.total);
    } catch (error) {
      toast.error("Failed to load orders");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const handleView = (order: DisplayOrder) => {
    navigate(`/user/order/${order._id}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">My Orders</h1>

      <EntityTable<DisplayOrder>
        title="Order History"
        data={orders}
        columns={[
          { key: "_id", label: "Order ID" },
          { key: "formattedAmount", label: "Amount" },
          { key: "formattedGateway", label: "Gateway" },
          { key: "formattedDate", label: "Date" },
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
