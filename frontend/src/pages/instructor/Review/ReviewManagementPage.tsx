import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Star,
  Flag,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import {
  getInstructorCourseReviews,
  flagReview,
  getCourseReviewStats,
} from "../../../api/action/InstructorActionApi";
import Card from "../../../components/common/Card";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import type { ReviewItem } from "../interface/instructorInterface";

export default function ReviewManagementPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "deleted">("all");

  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  });
  const [averageRating, setAverageRating] = useState(0);

  const [flagModal, setFlagModal] = useState<{
    open: boolean;
    reviewId?: string;
    student?: string;
  }>({ open: false });

  const fetchReviews = async (p: number) => {
    if (!courseId) return;
    try {
      const res = await getInstructorCourseReviews({
        courseId,
        page: p,
        limit,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
      });

      const mapped: ReviewItem[] = res.data.map((r: any) => ({
        id: r._id,
        rating: r.rating,
        comment: r.reviewText,
        studentName: r.student?.username || "Unknown",
        createdAt: r.createdAt,
        flagged: r.flaggedByInstructor,
        status: r.status,
        rejectionReason: r.rejectionReason,
      }));

      setReviews(mapped);
      setTotal(res.total || 0);
      setPage(res.page || 1);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load reviews");
    }
  };

  const fetchReviewStats = async () => {
    if (!courseId) return;
    try {
      const stats = await getCourseReviewStats(courseId);
      const raw = stats?.ratingCounts ?? {};
      const counts = {
        1: Number(raw["1"] ?? 0),
        2: Number(raw["2"] ?? 0),
        3: Number(raw["3"] ?? 0),
        4: Number(raw["4"] ?? 0),
        5: Number(raw["5"] ?? 0),
      };
      setRatingCounts(counts);
      setAverageRating(stats?.averageRating ?? 0);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load review statistics");
      setRatingCounts({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      setAverageRating(0);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  useEffect(() => {
    fetchReviews(page);
    if (page === 1) fetchReviewStats();
  }, [page, courseId, statusFilter, search]);

  const filteredReviews = useMemo(() => {
    let list = reviews;
    if (ratingFilter !== null) {
      list = list.filter((r) => r.rating === ratingFilter);
    }
    return list;
  }, [reviews, ratingFilter]);

  const toggleExpand = (id: string) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  
  const handleFlag = async () => {
    if (!flagModal.reviewId) return;
    try {
      await flagReview(flagModal.reviewId);
      toast.success("Review flagged successfully and sent to admin");
      fetchReviews(page);
      fetchReviewStats();
    } catch (err: any) {
      toast.error(err?.message || "Failed to flag review");
    } finally {
      setFlagModal({ open: false });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRatingFilter(null);
    setStatusFilter("all");
    toast.info("Filters cleared");
  };

  const goToPage = (p: number) => setPage(p);
  const goPrev = () => goToPage(Math.max(1, page - 1));
  const goNext = () => goToPage(Math.min(Math.ceil(total / limit), page + 1));

  const avgRating = averageRating.toFixed(1);
  const totalRatings = Object.values(ratingCounts).reduce((a, b) => a + b, 0);
  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters = search.trim() || ratingFilter !== null || statusFilter !== "all";

  // Status badge
  const getStatusBadge = (item: ReviewItem) => {
    const { status, flagged, rejectionReason } = item;

    if (flagged && status === "pending") {
      return (
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
            <Flag size={14} />
            Pending Admin Review
          </span>
        </div>
      );
    }

    if (status === "rejected") {
      return (
        <div className="flex flex-col gap-2 max-w-full">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            Rejected by Admin
          </span>
          {rejectionReason && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-800 mb-1">Admin's Rejection Reason:</p>
                  <p className="text-xs text-red-700 leading-relaxed">{rejectionReason}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (status === "deleted") {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          Deleted
        </span>
      );
    }

    if (status === "approved") {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          Approved
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
        {status}
      </span>
    );
  };

  // Render stars
  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={18}
          className={i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Review Management
          </h1>
          <p className="mt-2 text-base text-gray-600">
            View full student reviews, flag inappropriate content, and track status.
          </p>
        </div>

        {/* Rating Summary Card */}
        <Card className="mb-8 bg-white shadow-lg">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Overall Rating</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-5xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                    {avgRating}
                  </span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={32}
                        className={
                          i < Math.round(Number(avgRating))
                            ? "text-yellow-500 fill-yellow-500 drop-shadow-sm"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Based on <strong>{totalRatings}</strong> approved reviews
                </p>
              </div>

              <div className="w-full lg:w-80 space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const percentage = totalRatings > 0 ? (ratingCounts[star] / totalRatings) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <span className="w-12 text-gray-700 font-medium flex items-center gap-1">
                        {star} <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full transition-all duration-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm font-semibold text-gray-700">
                        {ratingCounts[star]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="mb-6 bg-white shadow-md">
          <div className="p-4 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search review text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex gap-3 flex-wrap items-center">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Reviews</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="deleted">Deleted</option>
              </select>

              {/* Rating Filter */}
              <select
                value={ratingFilter ?? ""}
                onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">All Ratings</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} Star{n !== 1 ? "s" : ""}</option>
                ))}
              </select>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <X size={16} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.length === 0 ? (
            <Card className="p-12 text-center text-gray-500 bg-white">
              No reviews match your filters.
            </Card>
          ) : (
            filteredReviews.map((item) => {
              const isExpanded = expandedReviews.has(item.id);
              const shouldTruncate = item.comment.length > 200;

              return (
                <Card key={item.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {item.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.studentName}</p>
                          <p className="text-xs text-gray-500">{item.createdAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {renderStars(item.rating)}
                        <span className="text-lg font-bold text-gray-700">{item.rating}.0</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p
                        className={`text-gray-700 leading-relaxed whitespace-pre-wrap ${
                          shouldTruncate && !isExpanded ? "line-clamp-3" : ""
                        }`}
                      >
                        {item.comment}
                      </p>
                      {shouldTruncate && (
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {isExpanded ? <>Show Less <ChevronUp size={16} /></> : <>Show More <ChevronDown size={16} /></>}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="w-full">{getStatusBadge(item)}</div>

                      {(item.status === "approved" || item.status === "rejected") && !item.flagged && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-gray-200">
                          <button
                            onClick={() =>
                              setFlagModal({ open: true, reviewId: item.id, student: item.studentName })
                            }
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                          >
                            <Flag size={16} />
                            {item.status === "rejected" ? "Re-flag for Admin Review" : "Flag Review"}
                          </button>
                          {item.status === "rejected" && (
                            <span className="text-xs text-gray-600 italic">
                              Disagree with admin's decision? Re-flag for further review.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-medium">{Math.min(page * limit, total)}</span> of{" "}
              <span className="font-medium">{total}</span> results
            </p>
            <div className="flex gap-1">
              <button
                onClick={goPrev}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && (
                <>
                  <span className="px-2 py-1.5 text-sm text-gray-500">...</span>
                  <button
                    onClick={() => goToPage(totalPages)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={goNext}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Flag Modal */}
        <ConfirmationModal
          isOpen={flagModal.open}
          title="Flag Review for Admin Review"
          message={
            <div className="text-gray-700">
              <p>
                Are you sure you want to <strong className="text-red-600">flag</strong> this review by{" "}
                <span className="font-semibold text-gray-900">{flagModal.student}</span>?
              </p>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium">What happens next:</p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Review will be sent to admin for moderation</li>
                  <li>Status will change to "Pending Admin Review"</li>
                  <li>Admin will either approve or reject with a reason</li>
                  <li>You can re-flag if you disagree with admin's decision</li>
                </ul>
              </div>
            </div>
          }
          confirmText="Yes, Flag Review"
          cancelText="Cancel"
          onConfirm={handleFlag}
          onCancel={() => setFlagModal({ open: false })}
        />
      </div>
    </div>
  );
}