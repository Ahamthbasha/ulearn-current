import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { membershipPurchaseHistory } from "../../../api/action/InstructorActionApi";
import EntityTable from "../../../components/common/EntityTable";
import { toast } from "react-toastify";

interface MembershipPlan {
  name: string;
  durationInDays: number;
}

interface MembershipOrder {
  membershipPlanId: MembershipPlan;
  price: number;
  paymentStatus: "pending" | "paid";
  txnId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<MembershipOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, total } = await membershipPurchaseHistory(page, limit);
      setOrders(data || []);
      setTotal(total || 0);
    } catch (err) {
      toast.error("Failed to fetch order history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const columns = [
    {
      key: "membershipPlanId" as keyof MembershipOrder,
      label: "Plan Name",
      render: (value: any) => value?.name || "-",
    },
    {
      key: "price" as keyof MembershipOrder,
      label: "Amount (₹)",
    },
    {
      key: "paymentStatus" as keyof MembershipOrder,
      label: "Status",
      render: (status: string) =>
        status === "paid" ? (
          <span className="text-green-600 font-medium">Paid</span>
        ) : (
          <span className="text-yellow-600 font-medium">Pending</span>
        ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Membership Purchase History</h2>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <EntityTable
          title="Your Membership Orders"
          data={orders}
          columns={columns}
          actionLabel="View"
          onAction={(order) =>
            navigate(`/instructor/membershipOrders/${order.txnId}`)
          }
          emptyText="No membership purchases found."
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
