import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, {
  type Column,
  type ActionButton,
} from "../../../components/AdminComponents/DataTable";
import { getCourseRequestList } from "../../../api/action/AdminActionApi";
import { toast } from "react-toastify";
import { Eye } from "lucide-react";
import { useDebounce } from "../../../hooks/UseDebounce";
import type { IAdminCourseOffer,GetCourseOffersResult,CourseOfferApiResponse } from "../interface/adminInterface";


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
    setError(null);
    try {
      const result = await getCourseRequestList(
        page,
        limit,
        debouncedSearch,
        status === "all" ? undefined : status
      ) as GetCourseOffersResult;

      // Map API response to IAdminCourseOffer
      const formattedOffers: IAdminCourseOffer[] = result.data.map((offer: CourseOfferApiResponse) => ({
        offerId: offer.offerId,
        courseId: offer.courseId,
        courseName: offer.courseName,
        instructorId: offer.instructorId,
        instructorName: offer.instructorName,
        discount: offer.discount,
        status: offer.status,
      }));

      setOffers(formattedOffers);
      setTotal(result.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch requests";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [page, debouncedSearch, status]);

  const columns: Column<IAdminCourseOffer>[] = [
    {
      key: "offerId",
      title: "S.No",
      render: (_value, _record, index) => (page - 1) * limit + index + 1,
      width: "80px",
    },
    {
      key: "courseName",
      title: "Course",
      render: (_value, record) => {
        const courseName = record.courseName || "-";
        return <span className="font-medium">{courseName}</span>;
      },
    },
    {
      key: "instructorName",
      title: "Instructor",
      render: (_value, record) => {
        const instructorName = record.instructorName || "-";
        return <span>{instructorName}</span>;
      },
    },
    {
      key: "discount",
      title: "Discount (%)",
      render: (value) => {
        const discount = typeof value === "number" ? value : 0;
        return (
          <span className="font-semibold text-green-600">{discount}%</span>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (value) => {
        const statusStr = String(value);
        const statusFormatted = statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
        
        let statusClass = "bg-gray-100 text-gray-700";
        if (statusStr === "approved") {
          statusClass = "bg-green-100 text-green-700";
        } else if (statusStr === "rejected") {
          statusClass = "bg-red-100 text-red-700";
        } else if (statusStr === "pending") {
          statusClass = "bg-yellow-100 text-yellow-700";
        }

        return (
          <span className={`px-2 py-1 text-sm rounded-full font-semibold ${statusClass}`}>
            {statusFormatted}
          </span>
        );
      },
    },
  ];

  const actions: ActionButton<IAdminCourseOffer>[] = [
    {
      key: "view",
      label: "View",
      icon: <Eye size={16} />,
      onClick: (record) => navigate(`/admin/courseOffer/${record.offerId}`),
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
      <DataTable<IAdminCourseOffer>
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
        onRetry={fetchOffers}
        emptyStateTitle="No Course Offers Found"
        emptyStateDescription="There are no course offer requests at this time."
      />
    </div>
  );
};

export default AdminCourseOfferListPage;