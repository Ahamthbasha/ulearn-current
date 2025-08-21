import React, { useEffect, useState } from "react";
import DataTable, { type Column } from "../../../components/AdminComponents/DataTable";
import { getMembershipPurchaseHistory } from "../../../api/action/AdminActionApi";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDebounce } from "../../../hooks/UseDebounce"; 

interface MembershipOrderDTO {
  instructorName: string;
  orderId: string;
  membershipName: string;
  price: number;
  status: "paid" | "pending" | "failed";
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<MembershipOrderDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const debouncedSearch = useDebounce(searchTerm, 500); // debounce search term
  const navigate = useNavigate();
  const limit = 5; // rows per page

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getMembershipPurchaseHistory(
        currentPage,
        limit,
        debouncedSearch
      );

      setOrders(response.data || []);
      const total = response.total || 0;
      setTotalPages(Math.ceil(total / limit));
      setError(null);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to fetch orders";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, debouncedSearch]); // listen to debouncedSearch instead of searchTerm

  const columns: Column<MembershipOrderDTO>[] = [
    {
      key: "orderId",
      title: "Order ID",
      render: (value) => (
        <span className="font-mono text-sm text-gray-700">{value}</span>
      ),
    },
    {
      key: "instructorName",
      title: "Instructor",
      render: (value) => <div className="text-sm text-gray-700">{value}</div>,
    },
    {
      key: "membershipName",
      title: "Plan",
      render: (value) => <div className="font-medium text-sm">{value}</div>,
    },
    {
      key: "price",
      title: "Price",
      render: (value) => `₹${value}`,
    },
    {
      key: "status",
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
          {value.charAt(0).toUpperCase() + value.slice(1)}
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
      searchValue={searchTerm}
      onSearchChange={(val) => {
        setCurrentPage(1); // reset to first page when searching
        setSearchTerm(val);
      }}
      actions={[
        {
          key: "view",
          label: "View Details",
          icon: <Eye size={16} />,
          onClick: (record) =>
            navigate(`/admin/membershipPurchase/${record.orderId}`),
        },
      ]}
    />
  );
};

export default Orders;
