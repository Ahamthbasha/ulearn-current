import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, {
  type Column,
  type ActionButton,
} from "../../../components/AdminComponents/DataTable";
import { Eye, FileText } from "lucide-react";
import { getAllVerificationRequests } from "../../../api/action/AdminActionApi";
import { useDebounce } from "../../../hooks/UseDebounce";
import { type VerificationRequestPage, type VerificationResponse } from "../interface/adminInterface";

const VerificationPage = () => {
  const [requests, setRequests] = useState<VerificationRequestPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(0);

  const navigate = useNavigate();
  const debouncedSearch = useDebounce(search, 500);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res: VerificationResponse = await getAllVerificationRequests(
        page,
        limit,
        debouncedSearch
      );

      if (!res || !res.success || !Array.isArray(res.data)) {
        throw new Error(res?.message || "Invalid data received");
      }

      setRequests(res.data);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      console.error("Error fetching verification requests", err);
      setError((err as Error).message || "Failed to fetch verification requests");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const columns: Column<VerificationRequestPage>[] = [
    {
      key: "id",
      title: "S.NO",
      render: (_, __, index) => (
        <span className="text-sm text-gray-900">
          {(page - 1) * limit + index + 1}
        </span>
      ),
    },
    { 
      key: "username", 
      title: "Name",
      render: (value) => (
        <div className="text-sm font-medium text-gray-900">{value as string}</div>
      ),
    },
    { 
      key: "email", 
      title: "Email",
      render: (value) => <div className="text-sm text-gray-900">{value as string}</div>,
    },
    { 
      key: "status", 
      title: "Status",
      render: (value) => {
        const statusValue = value as string;
        return (
          <span
            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
              statusValue === "approved"
                ? "bg-green-100 text-green-800"
                : statusValue === "rejected"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
          </span>
        );
      },
    },
  ];

  const actions: ActionButton<VerificationRequestPage>[] = [
    {
      key: "view",
      label: "View Details",
      icon: <Eye size={16} />,
      onClick: (record) => {
        navigate(`/admin/verificationDetail/${record.email}`);
      },
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
  ];

  return (
    <DataTable<VerificationRequestPage>
      title="Verification Requests"
      description="List of instructor verification requests."
      data={requests}
      loading={loading}
      error={error}
      columns={columns}
      actions={actions}
      onRetry={fetchRequests}
      emptyStateIcon={<FileText size={48} className="text-gray-300" />}
      emptyStateTitle="No Verification Requests"
      emptyStateDescription="No instructor verification requests have been submitted yet."
      pagination={{
        currentPage: page,
        totalPages: totalPages,
        onPageChange: handlePageChange,
      }}
      searchValue={search}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search by name or email..."
    />
  );
};

export default VerificationPage;