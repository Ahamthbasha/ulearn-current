import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import InstructorDataTable from "../../../components/InstructorComponents/InstructorDataTable";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { getInstructorCourseOffers, deleteInstructorCourseOffer } from "../../../api/action/InstructorActionApi";
import { toast } from "react-toastify";
import { Trash2, Edit2, Eye } from "lucide-react";
import { useDebounce } from "../../../hooks/UseDebounce"; 
import type { ICourseOffer } from "../interface/instructorInterface";

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
    try {
      const { data, total } = await getInstructorCourseOffers(
        currentPage,
        limit,
        debouncedSearch,
        statusFilter === "all" ? undefined : statusFilter
      );
      setCourseOffers(data);
      setTotal(total);
    } catch (err: any) {
      setError(err.message || "Failed to fetch offers");
      toast.error(err.message || "Failed to fetch offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [currentPage, limit, debouncedSearch, statusFilter]); // Use debouncedSearch instead of search

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
    } catch (err: any) {
      toast.error(err.message || "Failed to delete offer");
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedOfferId(null);
  };

  const columns = [
    { key: "serialNo", title: "S.No", render: (_: any, __: any, i: number) => (currentPage - 1) * limit + i + 1 },
    { key: "courseName", title: "Course", render: (_: any, record: ICourseOffer) => record.courseName || "-" },
    { key: "discount", title: "Discount (%)", render: (val: number) => `${val}%` },
    { key: "startDate", title: "Start Date", render: (date: string) => date },
    { key: "endDate", title: "End Date", render: (date: string) => date },
    { key: "status", title: "Status", render: (val: string) => val.charAt(0).toUpperCase() + val.slice(1) },
  ];

  const actions = [
    {
      key: "view",
      label: "View",
      icon: <Eye size={16} />,
      onClick: (rec: ICourseOffer) => navigate(`/instructor/courseOffer/${rec.courseOfferId}`),
      className: "bg-green-500 hover:bg-green-600 text-white",
    },
    {
      key: "edit",
      label: "Edit",
      icon: <Edit2 size={16} />,
      onClick: (rec: ICourseOffer) => navigate(`/instructor/editCourseOffer/${rec.courseOfferId}`),
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: (rec: ICourseOffer) => handleDeleteClick(rec.courseOfferId),
      className: "bg-red-500 hover:bg-red-600 text-white",
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Link to="/instructor/addCourseOffer" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
          Add Offer
        </Link>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by course name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
          />
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
      <InstructorDataTable
        title="My Course Offers"
        data={courseOffers}
        columns={columns}
        loading={loading}
        error={error}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showSearch={false} // Search is now handled inline
        actions={actions}
        emptyStateTitle="No Course Offers"
        emptyStateDescription="You have not created any course offers yet."
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