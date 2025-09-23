import { useEffect, useState } from "react";
import { Edit, Trash, Eye, Filter } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import InstructorDataTable from "../../../components/InstructorComponents/InstructorDataTable";
import { type InstructorColumn, type InstructorActionButton } from "../../../components/InstructorComponents/interface/instructorComponentInterface";
import {
  fetchInstructorCourses,
  instructorDeleteCourse,
} from "../../../api/action/InstructorActionApi";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { useDebounce } from "../../../hooks/UseDebounce";
import { type Course } from "../interface/instructorInterface";

const CourseListPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const limit = 10;

  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetchInstructorCourses({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
      });
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
  }, [page, debouncedSearch, statusFilter]);

  const confirmDelete = (course: Course) => {
    setCourseToDelete(course);
    setIsModalOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!courseToDelete) return;
    try {
      await instructorDeleteCourse(courseToDelete.courseId);
      toast.success("Course deleted");
      setCourses((prev) => prev.filter((c) => c.courseId !== courseToDelete.courseId));
      setTotal(prev => prev - 1);
    } catch (err: any) {
      toast.error("Failed to delete course");
    } finally {
      setIsModalOpen(false);
      setCourseToDelete(null);
    }
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const columns: InstructorColumn<Course>[] = [
    {
      key: "thumbnailUrl",
      title: "Thumbnail",
      width: "100px",
      render: (value) => (
        <div className="w-16 h-12 sm:w-20 sm:h-14 md:w-24 md:h-16 lg:w-28 lg:h-20 rounded-md overflow-hidden shadow-sm border border-gray-200 hover:scale-105 transform transition-transform duration-200 flex-shrink-0">
          <img
            src={value || "/default-thumbnail.jpg"}
            alt="Course Thumbnail"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/default-thumbnail.jpg";
            }}
          />
        </div>
      ),
    },
    {
      key: "courseName",
      title: "Course Name",
      width: "200px",
      render: (value) => (
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm sm:text-base font-medium text-gray-900 max-w-[120px] sm:max-w-[160px] md:max-w-[200px]">
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      title: "Category",
      width: "150px",
      render: (value) => (
        <div className="hidden md:block min-w-0">
          <span className="block truncate text-sm text-gray-700 max-w-[120px] lg:max-w-[180px]">
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: "120px",
      render: (value) => (
        <div className="flex justify-center sm:justify-start">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
              value
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-yellow-100 text-yellow-800 border border-yellow-200"
            }`}
          >
            <span className="hidden sm:inline">{value ? "Published" : "Unpublished"}</span>
            <span className="sm:hidden">{value ? "✅" : "⏳"}</span>
          </span>
        </div>
      ),
    }
  ];

  const actions: InstructorActionButton<Course>[] = [
    {
      key: "view",
      label: "View",
      icon: <Eye size={14} className="sm:w-4 sm:h-4" />,
      onClick: (record) => navigate(`/instructor/course/manage/${record.courseId}`),
      className: "bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 sm:px-3 sm:py-2",
    },
    {
      key: "edit",
      label: "Edit",
      icon: <Edit size={14} className="sm:w-4 sm:h-4" />,
      onClick: (record) => navigate(`/instructor/editCourse/${record.courseId}`),
      className: "bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 sm:px-3 sm:py-2",
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash size={14} className="sm:w-4 sm:h-4" />,
      onClick: confirmDelete,
      className: "bg-red-500 hover:bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-2",
    },
  ];

  // Enhanced responsive filter component
  const StatusFilter = () => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 p-4 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none">
      <div className="flex items-center gap-2 mb-2 sm:mb-0">
        <Filter size={16} className="text-gray-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Status:</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm min-w-[140px] flex-shrink-0"
        >
          <option value="">All Courses</option>
          <option value="published">📗 Published</option>
          <option value="unpublished">📙 Unpublished</option>
        </select>
        {statusFilter && (
          <button
            onClick={() => handleStatusFilterChange("")}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap"
          >
            Clear Filter
          </button>
        )}
      </div>
    </div>
  );

  // Responsive stats component
  const CourseStats = () => {
    const publishedCount = courses.filter(course => course.status === true).length;
    const unpublishedCount = courses.filter(course => course.status === false).length;

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm bg-white sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none border sm:border-0">
        <div className="flex items-center gap-4 sm:gap-2">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
            <span className="text-gray-600 text-xs sm:text-sm">Published: {publishedCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></span>
            <span className="text-gray-600 text-xs sm:text-sm">Unpublished: {unpublishedCount}</span>
          </div>
        </div>
        <div className="text-gray-500 text-xs sm:text-sm font-medium">
          Total: {total} courses
        </div>
      </div>
    );
  };

  // Generate confirmation message as string
  const getConfirmationMessage = () => {
    return `Are you sure you want to delete the course "${courseToDelete?.courseName || ""}"? This action cannot be undone and will permanently remove all course content.`;
  };

  return (
    <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full overflow-hidden">
      {/* Enhanced responsive header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          {/* Title and description */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage and edit all your created courses</p>
          </div>
          
          {/* Stats section - mobile first */}
          <div className="order-2 sm:order-1">
            <CourseStats />
          </div>
          
          {/* Active filter indicator */}
          {statusFilter && (
            <div className="flex justify-center sm:justify-start">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium inline-flex items-center gap-1">
                <Filter size={12} />
                Showing: {statusFilter === "published" ? "Published" : "Unpublished"} courses
              </span>
            </div>
          )}
        </div>
        
        {/* Filter section */}
        <StatusFilter />
      </div>

      {/* Data table with responsive wrapper */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="min-w-full inline-block align-middle">
          <InstructorDataTable
            data={courses}
            columns={columns}
            actions={actions}
            loading={loading}
            error={error}
            title=""
            description=""
            onRetry={fetchCourses}
            emptyStateTitle={statusFilter ? "No matching courses found" : "No courses created yet"}
            emptyStateDescription={
              statusFilter 
                ? `No ${statusFilter} courses found. Try adjusting your filter or create a new course.`
                : "Start creating your first course to get started with teaching."
            }
            showSearch
            searchValue={search}
            onSearchChange={handleSearchChange}
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Responsive confirmation modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        title="Delete Course"
        message={getConfirmationMessage()}
        confirmText="Yes, Delete Course"
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