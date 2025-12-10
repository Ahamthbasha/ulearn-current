import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable, {
  type Column,
  type ActionButton,
  type PaginationProps,
} from "../../../components/AdminComponents/DataTable";
import {
  getAdminCourseReviews,
  deleteAdminCourseReview,
} from "../../../api/action/AdminActionApi";
import { Star, Trash2, Eye, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useDebounce } from "../../../hooks/UseDebounce"; 
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import type { IAdminReviewDTO } from "../interface/adminInterface";

const StarRating: React.FC<{ rating: number; size?: number }> = ({
  rating,
  size = 16,
}) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        className={i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
      />
    ))}
  </div>
);

const AdminReviewManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");

  // Debounce the search value
  const debouncedSearch = useDebounce(search, 500);

  const [reviews, setReviews] = useState<IAdminReviewDTO[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReviewId, setModalReviewId] = useState<string | null>(null);

  const limit = 20;

  const fetchReviews = async () => {
    if (!courseId) {
      setError("Invalid course ID");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCourseReviews({
        courseId,
        page,
        limit,
        search: debouncedSearch || undefined,
        status: status || undefined,
      });
      setReviews(data.data);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when debounced search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Fetch reviews when dependencies change
  useEffect(() => {
    fetchReviews();
  }, [page, debouncedSearch, status, courseId]);

  const handleRetry = () => fetchReviews();

  const handleDeleteClick = (reviewId: string) => {
    setModalReviewId(reviewId);
    setModalOpen(true);
  };

  const handleModalConfirm = async () => {
    if (!modalReviewId) return;
    try {
      await deleteAdminCourseReview(modalReviewId);
      toast.success("Review deleted successfully");
      fetchReviews();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete review");
    } finally {
      setModalReviewId(null);
      setModalOpen(false);
    }
  };

  const handleModalCancel = () => {
    setModalReviewId(null);
    setModalOpen(false);
  };

  const columns: Column<IAdminReviewDTO>[] = useMemo(
    () => [
      {
        key: "studentName",
        title: "Student",
        render: (value: unknown, record: IAdminReviewDTO) => (
          <div className="flex items-center gap-2">
            {record.flaggedByInstructor && (
              <AlertCircle size={16} className="text-orange-600" />
            )}
            <span
              className={`font-medium ${
                record.flaggedByInstructor ? "text-orange-700" : "text-blue-700"
              }`}
            >
              {value as string}
            </span>
          </div>
        ),
      },
      {
        key: "rating",
        title: "Rating",
        render: (value: unknown) => <StarRating rating={value as number} />,
        width: "100px",
      },
      {
        key: "reviewText",
        title: "Review",
        render: (value: unknown, record: IAdminReviewDTO) => (
          <div className="max-w-xs">
            <p className="text-sm line-clamp-2">{value as string}</p>
            {record.rejectionReason && (
              <p className="text-xs text-red-600 mt-1 italic">
                Rejected: {record.rejectionReason}
              </p>
            )}
          </div>
        ),
      },
      {
        key: "createdAt",
        title: "Date",
        render: (value: unknown) => (
          <span className="text-xs text-gray-600">{value as string}</span>
        ),
        width: "140px",
      },
      {
        key: "status",
        title: "Status",
        render: (_: unknown, record: IAdminReviewDTO) => {
          const { status, flaggedByInstructor, isDeleted, rejectionReason } = record;

          if (isDeleted && status === "deleted") {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                Deleted
              </span>
            );
          }

          if (isDeleted) {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                Soft-Deleted
              </span>
            );
          }

          if (status === "rejected" || rejectionReason) {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Rejected
              </span>
            );
          }

          if (flaggedByInstructor || status === "pending") {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse"></span>
                Pending
              </span>
            );
          }

          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Approved
            </span>
          );
        },
        width: "120px",
        align: "center",
      },
    ],
    []
  );

  const actions: ActionButton<IAdminReviewDTO>[] = useMemo(
    () => [
      {
        key: "view",
        label: "View",
        icon: <Eye size={16} />,
        onClick: (r) => navigate(`/admin/reviews/${r._id}`),
        className: "bg-blue-500 hover:bg-blue-600 text-white",
      },
      {
        key: "delete",
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: (r) => handleDeleteClick(r._id),
        condition: (r) => !r.isDeleted && r.status !== "deleted",
        className: "bg-red-500 hover:bg-red-600 text-white",
      },
    ],
    [navigate]
  );

  const pagination: PaginationProps | undefined =
    totalPages > 1
      ? {
          currentPage: page,
          totalPages,
          onPageChange: setPage,
        }
      : undefined;

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "pending", label: "Pending" },
    { value: "deleted", label: "Deleted" },
  ];

  return (
    <>
      <DataTable<IAdminReviewDTO>
        data={reviews}
        columns={columns}
        actions={actions}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        title="Review Management"
        description="Manage course reviews and moderation"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by review text..."
        pagination={pagination}
        filters={[
          {
            key: "status",
            label: "Status",
            options: statusOptions,
            value: status,
            onChange: (v) => {
              setStatus(v);
              setPage(1);
            },
          },
        ]}
        emptyStateIcon={<Eye size={48} className="text-gray-400" />}
        emptyStateTitle="No reviews found"
        emptyStateDescription="Try adjusting your search or status filter."
      />

      <ConfirmationModal
        isOpen={modalOpen}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </>
  );
};

export default AdminReviewManagementPage;