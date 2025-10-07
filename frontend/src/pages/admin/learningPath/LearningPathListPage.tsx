import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Edit } from "lucide-react";
import DataTable from "../../../components/AdminComponents/DataTable";
import type { Column, ActionButton } from "../../../components/AdminComponents/DataTable";
import { getAdminLearningPaths } from "../../../api/action/AdminActionApi";
import type { LearningPathSummaryDTO } from "../../../types/interfaces/IAdminInterface";

const LearningPathListPage: React.FC = () => {
  const navigate = useNavigate();
  const [learningPaths, setLearningPaths] = useState<LearningPathSummaryDTO[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLearningPaths = async () => {
    setLoading(true);
    try {
      const response = await getAdminLearningPaths(currentPage, limit, search, status);
      setLearningPaths(response.data || []);
      setTotalPages(Math.ceil(response.total / limit) || 1);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch learning paths");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningPaths();
  }, [currentPage, search, status]);

  const columns: Column<LearningPathSummaryDTO>[] = [
    {
      key: "sno",
      title: "S.No.",
      render: (_value: any, _record: LearningPathSummaryDTO, index: number) => (
        <span>{(currentPage - 1) * limit + index + 1}</span>
      ),
      width: "10%",
    },
    {
      key: "title",
      title: "Title",
      render: (value: string) => <span className="font-medium">{value}</span>,
      width: "30%",
    },
    {
      key: "instructorName",
      title: "Instructor",
      render: (value: string | undefined) => <span>{value || "Unknown"}</span>,
      width: "20%",
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => {
        switch (value) {
          case "pending":
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
          case "accepted":
            return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Accepted</span>;
          case "rejected":
            return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Rejected</span>;
          case "draft":
            return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Draft</span>;
          default:
            return <span>{value}</span>;
        }
      },
      width: "15%",
    },
    {
      key: "LearningPathCourse",
      title: "Total Courses",
      render: (value: number) => <span>{value}</span>,
      width: "15%",
    },
    {
      key: "UnverifiedCourses",
      title: "Unverified Courses",
      render: (value: number) => <span>{value}</span>,
      width: "20%",
    },
  ];

  const actions: ActionButton<LearningPathSummaryDTO>[] = [
    {
      key: "view",
      label: "View Details",
      icon: <Eye size={16} />,
      onClick: (record) => navigate(`/admin/learningPaths/${record.learningPathId}`),
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    {
      key: "review",
      label: "Add Review",
      icon: <Edit size={16} />,
      onClick: (record) => navigate(`/admin/learningPaths/${record.learningPathId}`),
      className: "bg-purple-500 hover:bg-purple-600 text-white",
      condition: (record) => record.status === "pending",
    },
  ];

  return (
    <DataTable
      title="Learning Path Verification Requests"
      description="View and manage learning paths submitted for review"
      data={learningPaths}
      columns={columns}
      actions={actions}
      loading={loading}
      error={error}
      onRetry={fetchLearningPaths}
      emptyStateTitle="No Learning Paths Found"
      emptyStateDescription="No learning paths have been submitted for review."
      pagination={{
        currentPage,
        totalPages,
        onPageChange: setCurrentPage,
      }}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by title"
      leftSideHeaderContent={
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      }
    />
  );
};

export default LearningPathListPage;