import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../../components/AdminComponents/DataTable"; 
import { getCourseRequestList, verifyCourseOfferRequest } from "../../../api/action/AdminActionApi";
import { toast } from "react-toastify";
import { Check, X, Eye } from "lucide-react";
import type { ICourseOffer } from "../../../types/interfaces/IAdminInterface"; 

const AdminCourseOfferListPage: React.FC = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<ICourseOffer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data, total } = await getCourseRequestList(page, limit, search);
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
  }, [page, search]);

  const handleVerify = async (offer: ICourseOffer, approve: boolean) => {
    const confirmMsg = approve ? "approve" : "reject";
    const reason = approve ? "" : prompt("Please provide reason for rejection", offer.reviews || "") || "";
    if (!approve && !reason) {
      toast.info("Rejection reason is required");
      return;
    }
    if (!window.confirm(`Are you sure you want to ${confirmMsg} this offer?`)) return;

    try {
      await verifyCourseOfferRequest({
        offerId: offer._id,
        status: approve ? "approved" : "rejected",
        reviews: reason,
      });
      toast.success(`Offer ${approve ? "approved" : "rejected"} successfully`);
      fetchOffers();
    } catch (e: any) {
      toast.error(e.message || "Failed to update verification");
    }
  };

  const columns = [
    { key: "serial", title: "S.No", render: (_: any, __: any, i: number) => (page - 1) * limit + i + 1 },
    { 
      key: "courseName", 
      title: "Course", 
      render: (_: any, r: ICourseOffer) => r.courseId?.courseName || r.courseId?.name || "-" 
    },
    { 
      key: "instructor", 
      title: "Instructor", 
      render: (_: any, r: ICourseOffer) => r.instructorId?.name || r.instructorId?.email || "-" 
    },
    { key: "discount", title: "Discount (%)", render: (v: number) => `${v}%` },
    { key: "startDate", title: "Start Date", render: (v: string) => new Date(v).toLocaleDateString() },
    { key: "endDate", title: "End Date", render: (v: string) => new Date(v).toLocaleDateString() },
    { key: "status", title: "Status", render: (v: string) => v.charAt(0).toUpperCase() + v.slice(1) },
    { key: "reviews", title: "Admin Reviews", render: (v: string) => v || "-" },
  ];

  const actions = [
    {
      key: "view",
      label: "View",
      icon: <Eye size={16} />,
      onClick: (record: ICourseOffer) => navigate(`/admin/courseOffer/${record._id}`),
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    {
      key: "approve",
      label: "Approve",
      icon: <Check size={16} />,
      onClick: (record: ICourseOffer) => handleVerify(record, true),
      className: "bg-green-600 hover:bg-green-700 text-white",
      condition: (record: ICourseOffer) => record.status === "pending",
    },
    {
      key: "reject",
      label: "Reject",
      icon: <X size={16} />,
      onClick: (record: ICourseOffer) => handleVerify(record, false),
      className: "bg-red-600 hover:bg-red-700 text-white",
      condition: (record: ICourseOffer) => record.status === "pending",
    },
  ];

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    onPageChange: setPage,
  };

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
        searchPlaceholder="Search course or instructor"
        searchValue={search}
        onSearchChange={setSearch}
      />
    </div>
  );
};

export default AdminCourseOfferListPage;
