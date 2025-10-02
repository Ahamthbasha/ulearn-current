import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../../components/AdminComponents/DataTable";
import { type Column, type ActionButton } from "../../../components/AdminComponents/DataTable";
import { getCourseOffers, toggleCourseOfferActive, deleteCourseOffer } from "../../../api/action/AdminActionApi";
import type { ICourseOffer } from "../../../types/interfaces/IAdminInterface";
import { toast } from "react-toastify";
import { Edit2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useDebounce } from "../../../hooks/UseDebounce"; 
import ConfirmationModal from "../../../components/common/ConfirmationModal"; 

const CourseOffersPage: React.FC = () => {
  const navigate = useNavigate();
  const [courseOffers, setCourseOffers] = useState<ICourseOffer[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // State for modal visibility
  const [offerToToggle, setOfferToToggle] = useState<ICourseOffer | null>(null); // Track the offer to toggle
  const [offerToDelete, setOfferToDelete] = useState<ICourseOffer | null>(null); // Track the offer to delete

  // Use debouncing for search input
  const debouncedSearch = useDebounce(search, 500);

  const fetchCourseOffers = async () => {
    setLoading(true);
    try {
      const response = await getCourseOffers(currentPage, limit, debouncedSearch);
      setCourseOffers(response.data);
      setTotal(response.total || 0);
    } catch (err) {
      setError((err as Error).message);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseOffers();
  }, [currentPage, debouncedSearch]);

  const handleToggle = (offer: ICourseOffer) => {
    setOfferToToggle(offer);
    setIsModalOpen(true);
  };

  const confirmToggle = async () => {
    if (offerToToggle) {
      try {
        await toggleCourseOfferActive(offerToToggle._id);
        toast.success("Course offer toggled successfully");
        fetchCourseOffers();
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setIsModalOpen(false);
        setOfferToToggle(null);
      }
    }
  };

  const handleDelete = (offer: ICourseOffer) => {
    setOfferToDelete(offer);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (offerToDelete) {
      try {
        await deleteCourseOffer(offerToDelete._id);
        toast.success("Course offer deleted successfully");
        fetchCourseOffers();
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setIsModalOpen(false);
        setOfferToDelete(null);
      }
    }
  };

  const cancelAction = () => {
    setIsModalOpen(false);
    setOfferToToggle(null);
    setOfferToDelete(null);
  };

  const columns: Column<ICourseOffer>[] = [
    {
      key: "serialNo",
      title: "S.No",
      render: (_, __, index) => (currentPage - 1) * limit + index + 1, // Calculate serial number
    },
    {
      key: "courseName",
      title: "Course",
      render: (_, record) => record.courseId.courseName,
    },
    { key: "discountPercentage", title: "Discount (%)", render: (value) => `${value}%` },
    { key: "startDate", title: "Start Date", render: (value) => new Date(value).toLocaleDateString() },
    { key: "endDate", title: "End Date", render: (value) => new Date(value).toLocaleDateString() },
    {
      key: "isActive",
      title: "Status",
      render: (value) => (value ? "Active" : "Inactive"),
    },
  ];

  const actions: ActionButton<ICourseOffer>[] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Edit2 size={16} />,
      onClick: (record) => navigate(`/admin/editCourseOffer/${record._id}`),
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    {
      key: "toggle",
      label: (record) => (record.isActive ? "Deactivate" : "Activate"),
      icon: (record) => (record.isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />),
      onClick: handleToggle,
      className: (record) =>
        record.isActive ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-green-500 hover:bg-green-600 text-white",
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: handleDelete,
      className: "bg-red-500 hover:bg-red-600 text-white",
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 sm:p-6">
      <DataTable
        data={courseOffers}
        columns={columns}
        loading={loading}
        error={error}
        title="Course Offers"
        description="Manage course offers with discounts and validity periods"
        actions={actions}
        onRetry={fetchCourseOffers}
        emptyStateTitle="No Course Offers"
        emptyStateDescription="No course offers have been created yet."
        pagination={{
          currentPage,
          totalPages,
          onPageChange: (page) => setCurrentPage(page),
        }}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by course name..."
        leftSideHeaderContent={
          <Link
            to="/admin/addCourseOffer"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            Add Course Offer
          </Link>
        }
      />
      <ConfirmationModal
        isOpen={isModalOpen}
        message={
          offerToToggle
            ? `Are you sure you want to ${offerToToggle.isActive ? "deactivate" : "activate"} this course offer?`
            : "Are you sure you want to delete this course offer? This action cannot be undone."
        }
        onConfirm={offerToToggle ? confirmToggle : confirmDelete}
        onCancel={cancelAction}
      />
    </div>
  );
};

export default CourseOffersPage;