import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, Search } from "lucide-react";
import { adminGetAllWithdrawalRequests } from "../../../api/action/AdminActionApi";
import DataTable, { type Column, type ActionButton } from "../../../components/AdminComponents/DataTable";
import { useDebounce } from "../../../hooks/UseDebounce";

// Updated interface to match your DTO response
interface WithdrawalRequestDto {
  requestId: string;
  instructorName: string;
  instructorEmail: string;
  amount: number;
  status: string;
  createdAt: string;
  bankAccount: string;
}

export default function AdminWithdrawalPage() {
  const navigate = useNavigate();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequestDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const limit = 5;

  const fetchWithdrawalRequests = async (pageNum = 1, search = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetAllWithdrawalRequests(pageNum, limit, search);
      setWithdrawalRequests(res.transactions || []);
      setPage(res.currentPage || 1);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to load withdrawal requests";
      setError(errorMessage);
      toast.error(errorMessage);
      setWithdrawalRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handlePageChange = (pageNum: number) => {
    setPage(pageNum);
  };

  const handleViewDetails = (record: WithdrawalRequestDto) => {
    navigate(`/admin/withdrawals/${record.requestId}`);
  };

  const handleRetry = () => {
    fetchWithdrawalRequests(page, searchTerm);
  };

  // Trigger search whenever debounced term changes
  useEffect(() => {
    fetchWithdrawalRequests(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Trigger page change fetch
  useEffect(() => {
    fetchWithdrawalRequests(page, debouncedSearchTerm);
  }, [page]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "completed":
        return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium capitalize";
      case "rejected":
        return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium capitalize";
      case "pending":
        return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium capitalize";
      default:
        return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium capitalize";
    }
  };

  const getBankAccountColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "linked":
        return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium";
      case "not linked":
        return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium";
      default:
        return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium";
    }
  };

  const columns: Column<WithdrawalRequestDto>[] = [
    {
      key: "instructorName",
      title: "Instructor Details",
      width: "25%",
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 text-sm">{record.instructorName}</span>
          <span className="text-sm text-gray-500">{record.instructorEmail}</span>
        </div>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      width: "15%",
      render: (value) => (
        <span className="font-semibold text-green-600 text-sm">
          ₹{value.toFixed(2)}
        </span>
      ),
    },
    {
      key: "bankAccount",
      title: "Bank Account",
      width: "15%",
      render: (value) => (
        <span className={getBankAccountColor(value)}>
          {value}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: "15%",
      render: (value) => <span className={getStatusColor(value)}>{value}</span>,
    },
    {
      key: "createdAt",
      title: "Created Date",
      width: "25%",
      render: (value) => (
        <span className="text-sm text-gray-500">
          {value}
        </span>
      ),
    },
  ];

  const actions: ActionButton<WithdrawalRequestDto>[] = [
    {
      key: "view",
      label: "View Details",
      icon: <Eye size={16} />,
      onClick: handleViewDetails,
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
  ];

  const getSearchDescription = () => {
    if (searchTerm) {
      return `Found ${total} results for "${searchTerm}"`;
    }
    return `Showing ${total} withdrawal requests`;
  };

  const getEmptyStateProps = () => {
    if (searchTerm) {
      return {
        emptyStateIcon: <Search className="h-12 w-12 text-gray-300" />,
        emptyStateTitle: "No results found",
        emptyStateDescription: `No withdrawal requests found for "${searchTerm}". Try adjusting your search terms.`,
      };
    }
    return {
      emptyStateIcon: <Search className="h-12 w-12 text-gray-300" />,
      emptyStateTitle: "No withdrawal requests",
      emptyStateDescription: "No withdrawal requests have been submitted yet.",
    };
  };

  return (
    <DataTable<WithdrawalRequestDto>
      data={withdrawalRequests}
      columns={columns}
      loading={loading}
      error={error}
      title="Withdrawal Requests"
      description={getSearchDescription()}
      actions={actions}
      onRetry={handleRetry}
      pagination={{
        currentPage: page,
        totalPages: totalPages,
        onPageChange: handlePageChange,
      }}
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search by instructor name, email..."
      {...getEmptyStateProps()}
    />
  );
}