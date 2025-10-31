import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import InstructorDataTable from "../../../components/InstructorComponents/InstructorDataTable";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { getInstructorCourseOffers, deleteInstructorCourseOffer } from "../../../api/action/InstructorActionApi";
import { toast } from "react-toastify";
import { Trash2, Edit2, Eye } from "lucide-react";
import { useDebounce } from "../../../hooks/UseDebounce";
import type { ICourseOffer } from "../interface/instructorInterface";
import type { InstructorColumn, InstructorActionButton } from "../../../components/InstructorComponents/interface/instructorComponentInterface";

const InstructorCourseOffersPage: React.FC = () => {
  const navigate = useNavigate();
  const [courseOffers, setCourseOffers] = useState<ICourseOffer[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, total } = await getInstructorCourseOffers(
        currentPage,
        limit,
        debouncedSearch,
        statusFilter === "all" ? undefined : statusFilter
      );
      setCourseOffers(data);
      setTotal(total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch offers";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [currentPage, limit, debouncedSearch, statusFilter]);

  const handleDeleteClick = (courseOfferId: string) => {
    setSelectedOfferId(courseOfferId);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOfferId) return;
    try {
      await deleteInstructorCourseOffer(selectedOfferId);
      toast.success("Offer deleted successfully");
      setIsModalOpen(false);
      setSelectedOfferId(null);
      fetchOffers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete offer";
      toast.error(errorMessage);
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedOfferId(null);
  };

  const columns: InstructorColumn<ICourseOffer>[] = [
    {
      key: "serialNo",
      title: "S.No",
      render: (_value: unknown, _record: ICourseOffer, index: number) =>
        (currentPage - 1) * limit + index + 1,
    },
    {
      key: "courseName",
      title: "Course",
      render: (_value: unknown, record: ICourseOffer) => record.courseName || "-",
    },
    {
      key: "discount",
      title: "Discount (%)",
      render: (value: unknown) => `${value as number}%`,
    },
    {
      key: "startDate",
      title: "Start Date",
      render: (value: unknown) => value as string,
    },
    {
      key: "endDate",
      title: "End Date",
      render: (value: unknown) => value as string,
    },
    {
      key: "status",
      title: "Status",
      render: (value: unknown) => {
        const status = value as string;
        return status.charAt(0).toUpperCase() + status.slice(1);
      },
    },
  ];

  const actions: InstructorActionButton<ICourseOffer>[] = [
    {
      key: "view",
      label: "View",
      icon: <Eye size={16} />,
      onClick: (record: ICourseOffer) => navigate(`/instructor/courseOffer/${record.courseOfferId}`),
      className: "bg-green-500 hover:bg-green-600 text-white",
    },
    {
      key: "edit",
      label: "Edit",
      icon: <Edit2 size={16} />,
      onClick: (record: ICourseOffer) => navigate(`/instructor/editCourseOffer/${record.courseOfferId}`),
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: (record: ICourseOffer) => handleDeleteClick(record.courseOfferId),
      className: "bg-red-500 hover:bg-red-600 text-white",
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Link
          to="/instructor/addCourseOffer"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Add Offer
        </Link>
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <InstructorDataTable<ICourseOffer>
        title="My Course Offers"
        description="Manage your course discount offers."
        data={courseOffers}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={fetchOffers}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showSearch={true}
        searchValue={search}
        onSearchChange={setSearch}
        actions={actions}
        emptyStateTitle="No Course Offers"
        emptyStateDescription="You have not created course offers yet."
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this course offer? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
};

export default InstructorCourseOffersPage;