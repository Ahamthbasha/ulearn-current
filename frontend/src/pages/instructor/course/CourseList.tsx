import { useEffect, useState } from "react";
import { Edit, Trash, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import InstructorDataTable, {
  type InstructorColumn,
  type InstructorActionButton,
} from "../../../components/InstructorComponents/InstructorDataTable";
import {
  fetchInstructorCourses,
  instructorDeleteCourse,
} from "../../../api/action/InstructorActionApi";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

interface Course {
  _id: string;
  courseName: string;
  categoryName: string;
  isPublished: boolean;
  thumbnailSignedUrl?: string;
}

const CourseListPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 1; // You can change this as needed

  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetchInstructorCourses({ page, limit, search });
      console.log(response)
      setCourses(response?.data || []);
      setTotal(response?.total || 0);
    } catch (err: any) {
      toast.error("Failed to fetch courses");
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, search]);

  const confirmDelete = (course: Course) => {
    setCourseToDelete(course);
    setIsModalOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!courseToDelete) return;
    try {
      await instructorDeleteCourse(courseToDelete._id);
      toast.success("Course deleted");
      setCourses((prev) => prev.filter((c) => c._id !== courseToDelete._id));
    } catch (err: any) {
      toast.error("Failed to delete course");
    } finally {
      setIsModalOpen(false);
      setCourseToDelete(null);
    }
  };

  const columns: InstructorColumn<Course>[] = [
    {
      key: "thumbnailSignedUrl",
      title: "Thumbnail",
      width: "120px",
      render: (value) => (
        <div className="w-28 h-20 rounded-md overflow-hidden shadow-sm border border-gray-200 hover:scale-105 transform transition-transform duration-200">
          <img
            src={value || "/default-thumbnail.jpg"}
            alt="Course Thumbnail"
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },
    {
      key: "courseName",
      title: "Course Name",
      width: "220px",
      render: (value) => (
        <span className="block truncate max-w-[200px]">{value}</span>
      ),
    },
    {
      key: "categoryName",
      title: "Category",
      width: "200px",
      render: (value) => (
        <span className="block truncate max-w-[180px]">{value}</span>
      ),
    },
    {
      key: "isPublished",
      title: "Status",
      width: "140px",
      render: (value) => (
        <span
          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {value ? "Published" : "Unpublished"}
        </span>
      ),
    },
  ];

  const actions: InstructorActionButton<Course>[] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Edit size={16} />,
      onClick: (record) => navigate(`/instructor/editCourse/${record._id}`),
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash size={16} />,
      onClick: confirmDelete,
      className: "bg-red-500 hover:bg-red-600 text-white",
    },
    {
      key: "view",
      label: "View",
      icon: <Eye size={16} />,
      onClick: (record) => navigate(`/instructor/course/manage/${record._id}`),
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
  ];

  return (
    <div className="px-4">
      <InstructorDataTable
        data={courses}
        columns={columns}
        actions={actions}
        loading={loading}
        error={error}
        title="My Courses"
        description="Manage and edit all your created courses"
        onRetry={fetchCourses}
        emptyStateTitle="No courses created yet"
        emptyStateDescription="Create a course to get started."
        showSearch
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1); // reset page when searching
        }}
        currentPage={page}
        totalPages={Math.ceil(total / limit)}
        onPageChange={setPage}
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Delete Course"
        message={`Are you sure you want to delete the course "${
          courseToDelete?.courseName || ""
        }"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => {
          setIsModalOpen(false);
          setCourseToDelete(null);
        }}
      />
    </div>
  );
};

export default CourseListPage;
