import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getInstructorLearningPaths,
  deleteLearningPath,
  publishLearningPath,
  submitLearningPathVerification,
  resubmitLearningPathVerification,
} from "../../../api/action/InstructorActionApi";
import { type LearningPathDTO } from "../../../types/interfaces/IInstructorInterface";
import InputField from "../../../components/common/InputField";

const LearningPathListPage: React.FC = () => {
  const navigate = useNavigate();
  const [learningPaths, setLearningPaths] = useState<LearningPathDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchLearningPaths = async () => {
    try {
      const response = await getInstructorLearningPaths(page, limit, search, status);
      setLearningPaths(response.data || []);
      setTotal(response.total || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch learning paths");
    }
  };

  useEffect(() => {
    fetchLearningPaths();
  }, [page, search, status]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this learning path?")) {
      try {
        await deleteLearningPath(id);
        fetchLearningPaths();
      } catch (err: any) {
        setError(err.message || "Failed to delete learning path");
      }
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishLearningPath(id);
      fetchLearningPaths();
    } catch (err: any) {
      setError(err.message || "Failed to publish learning path");
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      await submitLearningPathVerification(id);
      fetchLearningPaths();
    } catch (err: any) {
      setError(err.message || "Failed to submit learning path");
    }
  };

  const handleResubmit = async (id: string) => {
    try {
      await resubmitLearningPathVerification(id);
      fetchLearningPaths();
    } catch (err: any) {
      setError(err.message || "Failed to resubmit learning path");
    }
  };

  const getStatusDisplay = (path: LearningPathDTO) => {
    switch (path.status) {
      case "draft":
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Draft</span>;
      case "pending":
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Pending</span>;
      case "accepted":
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Accepted</span>;
      case "rejected":
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Unknown</span>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Learning Paths</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="flex space-x-4 mb-4">
        <InputField
          name="search"
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          useFormik={false}
          placeholder="Search by title"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border-2 border-transparent text-black text-sm focus:outline-none bg-gray-100"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <button
          onClick={() => navigate("/instructor/learningPath/create")}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Create New
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {learningPaths.map((path) => (
          <div key={path._id} className="border p-4 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-semibold">{path.title}</h2>
              {getStatusDisplay(path)}
            </div>
            <p className="text-gray-600">{path.description}</p>
            <p className="text-sm">Courses: {path.items.length}</p>
            {path.adminReview && path.status === "rejected" && (
              <p className="text-sm text-red-600">Admin Review: {path.adminReview}</p>
            )}
            <div className="mt-2 space-x-2">
              <button
                onClick={() => navigate(`/instructor/learningPath/${path._id}`)}
                className="text-blue-500"
              >
                View
              </button>
              <button
                onClick={() => navigate(`/instructor/learningPath/edit/${path._id}`)}
                className="text-blue-500"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(path._id)}
                className="text-red-500"
              >
                Delete
              </button>
              {path.status === "draft" && (
                <button
                  onClick={() => handleSubmit(path._id)}
                  className="text-purple-500"
                >
                  Submit for Review
                </button>
              )}
              {path.status === "rejected" && (
                <button
                  onClick={() => handleResubmit(path._id)}
                  className="text-purple-500"
                >
                  Resubmit
                </button>
              )}
              {path.status === "accepted" && !path.isPublished && (
                <button
                  onClick={() => handlePublish(path._id)}
                  className="text-green-500"
                >
                  Publish
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex space-x-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page * limit >= total}
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default LearningPathListPage;