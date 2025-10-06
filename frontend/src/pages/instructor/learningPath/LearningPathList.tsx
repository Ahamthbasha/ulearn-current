import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getInstructorLearningPaths,
  deleteLearningPath,
  publishLearningPath,
} from "../../../api/action/InstructorActionApi";
import {type  LearningPathDTO } from "../../../types/interfaces/IInstructorInterface";
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
      const response: { data: LearningPathDTO[]; total: number } = await getInstructorLearningPaths(
        page,
        limit,
        search,
        status
      );
      setLearningPaths(response.data || []);
      setTotal(response.total || 0);
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
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
          <option value="scheduled">Scheduled</option>
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
            <h2 className="text-xl font-semibold">{path.title}</h2>
            <p className="text-gray-600">{path.description}</p>
            <p className="text-sm">
              Status: {path.isPublished ? "Published" : path.publishDate ? "Scheduled" : "Unpublished"}
            </p>
            <p className="text-sm">Courses: {path.items.length}</p>
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
              {!path.isPublished && !path.publishDate && (
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