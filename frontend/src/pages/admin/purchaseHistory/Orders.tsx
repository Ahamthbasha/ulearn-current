import React, { useEffect, useState } from "react";
import DataTable from "../../../components/AdminComponents/DataTable";

import { type Column } from "../../../components/AdminComponents/DataTable";
import { getMembershipPurchaseHistory } from "../../../api/action/AdminActionApi";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface Instructor {
  name: string;
  email: string;
}

interface MembershipPlan {
  name: string;
  durationInDays: number;
}

interface MembershipOrder {
  instructor: Instructor;
  membershipPlan: MembershipPlan;
  price: number;
  paymentStatus: "pending" | "paid" | "failed";
  startDate: string;
  endDate: string;
  txnId: string;
  createdAt: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<MembershipOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const navigate = useNavigate();
  const limit = 10;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getMembershipPurchaseHistory();
      console.log(response)
      setOrders(response.data);
      const total = response.total || 0;
      setTotalPages(Math.ceil(total / limit));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch orders");
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const columns: Column<MembershipOrder>[] = [
    {
      key: "instructor",
      title: "Instructor",
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.instructor.name}</div>
          <div className="text-sm text-gray-500">{record.instructor.email}</div>
        </div>
      ),
    },
    {
      key: "membershipPlan",
      title: "Plan",
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.membershipPlan.name}</div>
          <div className="text-sm text-gray-500">{record.membershipPlan.durationInDays} days</div>
        </div>
      ),
    },
    {
      key: "price",
      title: "Price",
      render: (value) => `₹${value}`,
    },
    {
      key: "paymentStatus",
      title: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            value === "paid"
              ? "bg-green-100 text-green-600"
              : value === "failed"
              ? "bg-red-100 text-red-600"
              : "bg-yellow-100 text-yellow-600"
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      title="Membership Purchase History"
      description="View all instructor membership purchases"
      data={orders}
      columns={columns}
      loading={loading}
      error={error}
      onRetry={fetchOrders}
      pagination={{
        currentPage,
        totalPages,
        onPageChange: (page) => setCurrentPage(page),
      }}
      actions={[
        {
          key: "view",
          label: "View Details",
          icon: <Eye size={16} />,
          onClick: (record) => navigate(`/admin/membershipPurchase/${record.txnId}`),
        },
      ]}
    />
  );
};

export default Orders;
