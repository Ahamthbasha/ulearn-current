import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../../components/AdminComponents/DataTable";
import { getCourseRequestList } from "../../../api/action/AdminActionApi";
import { toast } from "react-toastify";
import { Eye } from "lucide-react";
import { useDebounce } from "../../../hooks/UseDebounce";
import type { IAdminCourseOffer } from "../../../types/interfaces/IAdminInterface";

const AdminCourseOfferListPage: React.FC = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<IAdminCourseOffer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data, total } = await getCourseRequestList(page, limit, debouncedSearch, status === "all" ? undefined : status);
      setOffers(data);
      setTotal(total);
    } catch (err: any) {
      setError(err.message || "Failed to fetch requests");
      toast.error(err.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [page, debouncedSearch, status]);

  const columns = [
    { key: "serial", title: "S.No", render: (_: any, __: any, i: number) => (page - 1) * limit + i + 1 },
    {
      key: "courseName",
      title: "Course",
      render: (_: any, r: IAdminCourseOffer) => r.courseName || "-",
    },
    {
      key: "instructorName",
      title: "Instructor",
      render: (_: any, r: IAdminCourseOffer) => r.instructorName || "-",
    },
    { key: "discount", title: "Discount (%)", render: (v: number) => `${v}%` },
    { key: "status", title: "Status", render: (v: string) => v.charAt(0).toUpperCase() + v.slice(1) },
  ];

  const actions = [
    {
      key: "view",
      label: "View",
      icon: <Eye size={16} />,
      onClick: (record: IAdminCourseOffer) => navigate(`/admin/courseOffer/${record.offerId}`),
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
  ];

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    onPageChange: setPage,
  };

  const filters = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "all", label: "All" },
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ],
      value: status,
      onChange: setStatus,
    },
  ];

  return (
    <div className="p-6">
      <DataTable
        title="Course Offer Requests"
        description="List of course offers pending for admin verification"
        data={offers}
        columns={columns}
        actions={actions}
        pagination={pagination}
        loading={loading}
        error={error}
        searchPlaceholder="Search based on course name"
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
      />
    </div>
  );
};

export default AdminCourseOfferListPage;