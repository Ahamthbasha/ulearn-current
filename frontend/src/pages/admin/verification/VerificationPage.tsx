import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column, type ActionButton } from "../../../components/AdminComponents/DataTable";
import { Eye } from "lucide-react";
import { getAllVerificationRequests } from "../../../api/action/AdminActionApi";

interface VerificationRequest {
  _id: string;
  username: string;
  email: string;
  status: string;
  resumeUrl: string;
  degreeCertificateUrl: string;
  reviewedAt?: Date;
}

const VerificationPage = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5); // ⬅️ Change this to desired items per page
  const [total, setTotal] = useState(0);

  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getAllVerificationRequests(page, limit, search);
      if (!res || !Array.isArray(res.data)) {
        throw new Error("Invalid data received");
      }

      setRequests(res.data);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Error fetching verification requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, search]);

  const columns: Column<VerificationRequest>[] = [
    {
      key: "serialNo",
      title: "S.NO",
      render: (_, __, index) => (
        <span className="text-sm text-gray-900">
          {(page - 1) * limit + index + 1}
        </span>
      ),
    },
    { key: "username", title: "Name" },
    { key: "email", title: "Email" },
    { key: "status", title: "Status" },
  ];

  const actions: ActionButton<VerificationRequest>[] = [
    {
      key: "view",
      label: "View Details",
      icon: <Eye size={16} />,
      onClick: (record) => {
        navigate(`/admin/verificationDetail/${record.email}`);
      },
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <DataTable
      title="Verification Requests"
      description="List of instructor verification requests."
      data={requests}
      loading={loading}
      columns={columns}
      actions={actions}
      pagination={{
        currentPage: page,
        totalPages: totalPages,
        onPageChange: (newPage) => setPage(newPage),
      }}
      searchValue={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1); // reset to page 1 on search
      }}
      searchPlaceholder="Search by name or email..."
    />
  );
};

export default VerificationPage;
