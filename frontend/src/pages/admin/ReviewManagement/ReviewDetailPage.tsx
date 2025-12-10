import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Star, AlertCircle, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import {
  getSpecificReviewById,
  approveAdminCourseReview,
  rejectAdminCourseReview,
} from "../../../api/action/AdminActionApi";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import type { IReviewDetail } from "../interface/adminInterface";

const ReviewDetailPage: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  
  const [review, setReview] = useState<IReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);

  useEffect(() => {
    const fetchReview = async () => {
      if (!reviewId) return;
      try {
        const data = await getSpecificReviewById(reviewId);
        setReview(data);
      } catch {
        toast.error("Failed to load review");
        navigate("/admin/reviews");
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [reviewId, navigate]);

  const handleApproveConfirm = async () => {
    if (!reviewId) return;
    
    setActionLoading(true);
    setApproveModal(false);
    try {
      await approveAdminCourseReview(reviewId);
      toast.success("Review approved & removed from public");
      navigate(`/admin/course/reviews/${review?.courseId}`);
    } catch {
      toast.error("Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!reason.trim() || reason.length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }
    
    if (!reviewId) return;
    
    setActionLoading(true);
    setRejectModal(false);
    try {
      await rejectAdminCourseReview(reviewId, reason.trim());
      toast.success("Review rejected and instructor notified");
      navigate(`/admin/course/reviews/${review?.courseId}`);
    } catch {
      toast.error("Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <p className="text-xl text-red-600 font-semibold">Review not found</p>
        </div>
      </div>
    );
  }

  const displayName = review.studentName?.trim() || `User_${String(review.studentId).slice(-6)}` || "Unknown User";
  const initials = displayName.charAt(0).toUpperCase();
  const isRejected = review.status === "rejected";
  const isPending = review.flaggedByInstructor && review.status === "pending";
  const isReFlagged = review.rejectionReason && review.flaggedByInstructor;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/admin/course/reviews/${review?.courseId}`)}
          className="group mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all duration-200 font-medium"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Reviews</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  Review Details
                </h1>
                <p className="text-blue-100 text-sm font-medium">
                  Course ID: {review.courseId}
                </p>
              </div>
              
              {isPending && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold text-sm shadow-lg">
                  <AlertCircle size={18} />
                  <span>{isReFlagged ? "Re-flagged by Instructor" : "Flagged by Instructor"}</span>
                </div>
              )}
              
              {isRejected && !isPending && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold text-sm shadow-lg">
                  <XCircle size={18} />
                  <span>Rejected</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Student Info & Rating */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-2xl shadow-lg ring-4 ring-blue-100">
                  {initials}
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{displayName}</p>
                  <p className="text-sm text-gray-500 mt-1">{review.createdAt}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 sm:ml-auto">
                <StarRating rating={review.rating} size={28} />
                <span className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  {review.rating}.0
                </span>
              </div>
            </div>

            {/* Review Text */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                Review Content
              </h3>
              <div className="bg-gray-50 rounded-xl p-5 text-gray-700 leading-relaxed text-base border border-gray-200 shadow-sm">
                {review.reviewText}
              </div>
            </div>

            {/* Previous Rejection Reason (if exists) */}
            {review.rejectionReason && (
              <div className="p-5 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-800 mb-1">Previous Rejection Reason:</p>
                    <p className="text-sm text-red-700">{review.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isPending && (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Approve Button */}
                  <button
                    onClick={() => setApproveModal(true)}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={20} />
                    <span>Approve & Remove From Public</span>
                  </button>

                  {/* Reject Button */}
                  <button
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle size={20} />
                    <span>{showRejectForm ? "Cancel Reject" : "Reject with Reason"}</span>
                  </button>
                </div>

                {/* Reject Form */}
                {showRejectForm && (
                  <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl space-y-4 animate-slideDown">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Rejection Reason (Min 10 characters)
                      </label>
                      <textarea
                        placeholder="Enter detailed reason for rejection. The instructor will see this message..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-4 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-base font-medium bg-white shadow-sm transition-all"
                        rows={4}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-600">
                          {reason.length}/10 characters minimum
                        </p>
                        {reason.length >= 10 && (
                          <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                            <CheckCircle size={14} />
                            Ready to submit
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setRejectModal(true)}
                      disabled={actionLoading || !reason.trim() || reason.length < 10}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                    >
                      {actionLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Rejecting...</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={20} />
                          <span>Submit Rejection</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Already Rejected Message */}
            {isRejected && !isPending && (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-3">
                  <CheckCircle size={32} className="text-gray-600" />
                </div>
                <p className="text-lg font-semibold text-gray-700">
                  This review has already been processed
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Status: Rejected
                </p>
              </div>
            )}

            {/* Approved but not flagged */}
            {!isPending && !isRejected && review.status === "approved" && (
              <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-200 rounded-full mb-3">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <p className="text-lg font-semibold text-green-700">
                  This review is currently approved and public
                </p>
                <p className="text-sm text-green-600 mt-1">
                  No action required
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      <ConfirmationModal
        isOpen={approveModal}
        title="Approve Review"
        message={
          <div>
            <p className="mb-3">
              Are you sure you want to <strong className="text-green-400">approve</strong> this review?
            </p>
            <div className="text-left space-y-2 text-sm">
              <p className="text-gray-400">• Review will be removed publicly</p>
              <p className="text-gray-400">• Students cannot see this review on the course page</p>
              <p className="text-gray-400">• This action will update the course rating</p>
            </div>
          </div>
        }
        confirmText="Yes, Approve"
        cancelText="Cancel"
        onConfirm={handleApproveConfirm}
        onCancel={() => setApproveModal(false)}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmationModal
        isOpen={rejectModal}
        title="Reject Review"
        message={
          <div>
            <p className="mb-3">
              Are you sure you want to <strong className="text-red-400">reject</strong> this review?
            </p>
            <div className="bg-gray-800 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-400 mb-1">Your rejection reason:</p>
              <p className="text-sm text-gray-200">{reason}</p>
            </div>
            <div className="text-left space-y-2 text-sm">
              <p className="text-gray-400">• Instructor will be notified with your reason</p>
              <p className="text-gray-400">• Instructor can re-flag if they disagree</p>
            </div>
          </div>
        }
        confirmText="Yes, Reject"
        cancelText="Cancel"
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectModal(false)}
      />

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        className={
          i <= rating 
            ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" 
            : "text-gray-300"
        }
      />
    ))}
  </div>
);

export default ReviewDetailPage;