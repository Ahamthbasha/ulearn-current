import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, X, ArrowLeft } from "lucide-react";
import Card from "../../../components/common/Card";
import { getAdminLearningPathById, verifyLearningPath } from "../../../api/action/AdminActionApi";
import type { LearningPathDTO } from "../../../types/interfaces/IAdminInterface";

const LearningPathDetailPage: React.FC = () => {
  const { learningPathId } = useParams<{ learningPathId: string }>();
  const navigate = useNavigate();
  const [learningPath, setLearningPath] = useState<LearningPathDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLearningPath = async () => {
      if (!learningPathId) {
        setError("Invalid learning path ID");
        setLoading(false);
        return;
      }
      try {
        const response = await getAdminLearningPathById(learningPathId);
        setLearningPath({ ...response, items: response.items ?? [] });
        setReview(response.adminReview || "");
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load learning path");
      } finally {
        setLoading(false);
      }
    };
    fetchLearningPath();
  }, [learningPathId]);

  const handleVerify = async (status: "accepted" | "rejected") => {
    if (!learningPathId || !review.trim()) {
      setError("Review comment is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await verifyLearningPath(learningPathId, status, review.trim());
      setLearningPath({ ...updated, items: updated.items ?? [] });
      setError(null);
    } catch (err: any) {
      setError(err.message || `Failed to ${status} learning path`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !learningPath) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => navigate("/admin/learningPaths")}
              className="mt-4 inline-flex items-center bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition text-sm"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Learning Paths
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!learningPath) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <p className="text-gray-600">Learning path not found</p>
        </Card>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (learningPath.status) {
      case "pending":
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Pending</span>;
      case "accepted":
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Accepted</span>;
      case "rejected":
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Rejected</span>;
      case "draft":
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Draft</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Unknown</span>;
    }
  };

  const unverifiedCourses = learningPath.items.filter((item) => !item.isVerified).length;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card
        title={learningPath.title}
        header={
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/admin/learningPaths")}
              className="inline-flex items-center text-blue-500 hover:text-blue-600 text-sm"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </button>
            <div className="flex items-center space-x-2">
              {getStatusBadge()}
              {learningPath.isPublished && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Published</span>
              )}
              {!learningPath.isPublished && learningPath.publishDate && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Scheduled</span>
              )}
              {!learningPath.isPublished && !learningPath.publishDate && (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Unpublished</span>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{learningPath.description}</p>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                <span className="font-medium">Instructor:</span>{" "}
                {learningPath.instructorName || learningPath.instructorId || "Unknown"}
              </div>
              {learningPath.publishDate && (
                <div>
                  <span className="font-medium">Publish Date:</span>{" "}
                  {learningPath.publishDate}
                </div>
              )}
              <div>
                <span className="font-medium">Created:</span>{" "}
                {learningPath.createdAt}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {learningPath.updatedAt}
              </div>
            </div>
          </div>

          {/* Admin Review */}
          {learningPath.adminReview && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Review</h3>
              <p className={`text-sm ${learningPath.status === "rejected" ? "text-red-600" : "text-gray-700"}`}>
                {learningPath.adminReview}
              </p>
            </div>
          )}

          {/* Courses */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Courses ({learningPath.items?.length ?? 0})
            </h3>
            {learningPath.items?.length > 0 ? (
              <div className="space-y-4">
                {learningPath.items.map((item, index) => (
                  <div
                    key={item.courseId || `item-${index}`}
                    className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    {item.thumbnailUrl && (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.courseName || "Course"}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/96?text=No+Image";
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">
                          {item.order}
                        </span>
                        <h4 className="text-lg font-medium text-gray-900">
                          {item.courseName || "Unknown Course"}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-500">
                        Price: ₹{item.price !== undefined ? item.price.toFixed(2) : "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Verified: {item.isVerified ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-red-600">No</span>
                        )}
                      </p>
                      <button
                        onClick={() => navigate(`/admin/courses/${item.courseId}`)}
                        className="mt-2 text-blue-500 hover:text-blue-600 text-sm font-medium underline"
                      >
                        View Course Details and verify
                      </button>
                    </div>
                  </div>
                ))}
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Total Amount: ₹{learningPath.totalAmount.toFixed(2)}
                  </h4>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No courses assigned to this learning path.</p>
            )}
          </div>

          {/* Unverified Courses Warning */}
          {learningPath.status === "pending" && unverifiedCourses > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-700">
                Warning: {unverifiedCourses} course{unverifiedCourses > 1 ? "s are" : " is"} not verified. All courses must be verified to accept this learning path.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Review and Verification */}
          {learningPath.status === "pending" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review and Verify</h3>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Enter your review comments..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                rows={4}
              />
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => handleVerify("accepted")}
                  disabled={isSubmitting || !review.trim() || unverifiedCourses > 0}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isSubmitting || !review.trim() || unverifiedCourses > 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  <Check size={16} className="mr-2" />
                  {isSubmitting ? "Accepting..." : "Accept"}
                </button>
                <button
                  onClick={() => handleVerify("rejected")}
                  disabled={isSubmitting || !review.trim()}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isSubmitting || !review.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  <X size={16} className="mr-2" />
                  {isSubmitting ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LearningPathDetailPage;