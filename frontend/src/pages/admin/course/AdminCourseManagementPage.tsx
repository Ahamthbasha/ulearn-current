import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, {
  type Column,
  type ActionButton,
} from "../../../components/AdminComponents/DataTable";
import {
  getAllCourses,
  listUnListCourse,
} from "../../../api/action/AdminActionApi";
import { Eye, EyeOff, Info } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { useDebounce } from "../../../hooks/UseDebounce";
import { type AdminCourse } from "../interface/adminInterface";

const AdminCourseManagementPage = () => {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  // ✅ Add debounced search term
  const debouncedSearch = useDebounce(search, 300);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllCourses(debouncedSearch, page, limit);
      
      // ✅ Updated mapping to match new backend response structure
      const formattedCourses: AdminCourse[] = (result.data || []).map((course: any) => ({
        _id: course.courseId, // Map courseId to _id for internal usage
        courseId: course.courseId, // Keep original courseId
        courseName: course.courseName,
        isListed: course.isListed,
      }));
      
      setCourses(formattedCourses);
      const total = result.total || 0;
      setTotalPages(Math.ceil(total / limit));
    } catch (err) {
      setError("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit]);

  const requestToggleListing = (course: AdminCourse) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  // ✅ Optimized toggle handler with optimistic updates
  const confirmToggleListing = async () => {
    if (!selectedCourse) return;

    try {
      // ✅ Optimistic update - Update UI immediately
      setCourses(prev =>
        prev.map(course =>
          course.courseId === selectedCourse.courseId // Use courseId for comparison
            ? { ...course, isListed: !course.isListed }
            : course
        )
      );

      // Use courseId for the API call
      const updated = await listUnListCourse(selectedCourse.courseId);
      
      toast.success(
        `Course ${updated.data.isListed ? "listed" : "unlisted"} successfully`
      );
      
    } catch (err: any) {
      // ✅ Revert optimistic update on error
      setCourses(prev =>
        prev.map(course =>
          course.courseId === selectedCourse.courseId
            ? { ...course, isListed: !course.isListed }
            : course
        )
      );

      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to toggle listing");
      }
    } finally {
      setIsModalOpen(false);
      setSelectedCourse(null);
    }
  };

  const columns: Column<AdminCourse>[] = [
    {
      key: "serial",
      title: "S.No",
      render: (_value, _record, index) => (page - 1) * limit + index + 1,
      width: "60px",
    },
    {
      key: "courseName",
      title: "Course Name",
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: "isListed",
      title: "Status",
      render: (value: boolean) => (
        <span
          className={`px-2 py-1 text-sm rounded-full font-semibold ${
            value
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {value ? "Listed" : "Not Listed"}
        </span>
      ),
    },
  ];

const actions: ActionButton<AdminCourse>[] = [
  {
    key: "toggleListing",
    label: (record) => (record.isListed ? "Unlist" : "List"),
    icon: (record) =>
      record.isListed ? <EyeOff size={18} /> : <Eye size={18} />,
    onClick: (record) => requestToggleListing(record),
    className: (record) =>
      record.isListed
        ? "bg-green-500 hover:bg-green-600 text-white" // ✅ Green when listed
        : "bg-red-500 hover:bg-red-600 text-white",    // ✅ Red when unlisted
  },
  {
    key: "viewDetails",
    label: "View",
    icon: () => <Info size={18} />,
    onClick: (record) => navigate(`/admin/courses/${record.courseId}`),
    className: "bg-blue-500 hover:bg-blue-600 text-white",
  },
];


  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <>
      <DataTable
        data={courses}
        columns={columns}
        actions={actions}
        loading={loading}
        error={error}
        title="Course Management"
        description="Manage listed and unlisted courses from instructors."
        onRetry={fetchCourses}
        emptyStateTitle="No Courses Available"
        emptyStateDescription="There are no courses to display at this moment."
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by course name"
        pagination={{
          currentPage: page,
          totalPages,
          onPageChange: handlePageChange,
        }}
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Please Confirm"
        message={`Are you sure you want to ${
          selectedCourse?.isListed ? "unlist" : "list"
        } the course "${selectedCourse?.courseName}"?`}
        confirmText={selectedCourse?.isListed ? "Unlist" : "List"}
        cancelText="Cancel"
        onConfirm={confirmToggleListing}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedCourse(null);
        }}
      />
    </>
  );
};

export default AdminCourseManagementPage;