import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLearningPathById } from "../../../api/action/StudentAction";
import type { LearningPathDTO } from "../../../types/interfaces/IStudentInterface";
import type { ApiError } from "../../../types/interfaces/ICommon";

const LearningPathViewPage: React.FC = () => {
  const { learningPathId } = useParams<{ learningPathId: string }>();
  const navigate = useNavigate();
  const [learningPath, setLearningPath] = useState<LearningPathDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLearningPath = async () => {
      if (!learningPathId) {
        setError("Invalid learning path ID");
        setLoading(false);
        return;
      }
      try {
        const response = await getLearningPathById(learningPathId);
        setLearningPath({ ...response, items: response.items ?? [] });
        setError(null);
      } catch (err: unknown) {
        const apiError = err as ApiError;
        setError(apiError.message || "Failed to load learning path");
      } finally {
        setLoading(false);
      }
    };
    fetchLearningPath();
  }, [learningPathId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !learningPath) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate("/user/createdLms")}
            className="mt-4 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition"
          >
            Back to Learning Paths
          </button>
        </div>
      </div>
    );
  }

  if (!learningPath) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-gray-600">Learning path not found</p>
      </div>
    );
  }

  const isPurchased = learningPath.isPurchased;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {learningPath.title}
          </h1>

          {/* Purchased Badge */}
          {isPurchased && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800">
              Already Purchased
            </span>
          )}
        </div>

        <p className="text-gray-700 text-lg mb-4">{learningPath.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div>
            <span className="font-medium">Category:</span> {learningPath.categoryName}
          </div>
          <div>
            <span className="font-medium">Created:</span> {learningPath.createdAt}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span> {learningPath.updatedAt}
          </div>
          <div>
            <span className="font-medium">Total Price:</span> ₹
            {learningPath.totalPrice.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Courses Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Courses ({learningPath.items?.length ?? 0})
        </h2>

        {learningPath.items?.length > 0 ? (
          <div className="space-y-4">
            {learningPath.items.map((item, index) => (
              <div
                key={item.courseId || `item-${index}`}
                className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.courseName || "Course"}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/96?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="bg-gray-200 border-2 border-dashed rounded-lg w-24 h-24 flex items-center justify-center text-gray-500 text-xs">
                    No Image
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">
                      {item.order}
                    </span>
                    <h3 className="text-lg font-medium text-gray-900">
                      {item.courseName || "Unknown Course"}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    Price: ₹
                    {item.price !== undefined ? item.price.toFixed(2) : "N/A"}
                  </p>
                  <button
                    onClick={() => navigate(`/user/course/${item.courseId}`)}
                    className="mt-2 text-blue-500 hover:text-blue-600 text-sm font-medium underline"
                  >
                    View Course Details
                  </button>
                </div>
              </div>
            ))}

            {/* Total Price Footer */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Total Price for This Learning Path: ₹
                {learningPath.totalPrice.toFixed(2)}
              </h2>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No courses assigned to this learning path.</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate("/user/createdLms")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition font-medium"
        >
          Back
        </button>

        {/* Edit Button - Only show if NOT purchased */}
        {!isPurchased && (
          <button
            onClick={() => navigate(`/user/learningPath/edit/${learningPathId}`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition font-medium"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default LearningPathViewPage;