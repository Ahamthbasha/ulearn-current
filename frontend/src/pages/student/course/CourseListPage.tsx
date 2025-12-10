import { useEffect, useState } from "react";
import {
  CoursesFiltered,
  getAllCategories,
} from "../../../api/action/StudentAction";
import CourseCard from "../../../components/StudentComponents/CourseCard";
import { toast } from "react-toastify";
import { type CourseList, type Category, type CourseFilterResponse,type SortOption } from "../interface/studentInterface";
import type { ApiError } from "../../../types/interfaces/ICommon";

const CourseListPage = () => {
  const [courses, setCourses] = useState<CourseList[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const coursesPerPage = 8;

  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  useEffect(() => {
    fetchCourses();
  }, [currentPage, debouncedSearch, sortOption, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response: CourseFilterResponse = await CoursesFiltered(
        currentPage,
        coursesPerPage,
        debouncedSearch,
        sortOption,
        selectedCategory
      );

      setCourses(response.data || []);
      setTotalPages(response.totalPages || Math.ceil((response.total || 0) / coursesPerPage));
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getAllCategories();
      const categoriesData = response.data || response;
      setCategories(categoriesData);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.response?.data?.message || "Failed to load categories");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSortOption("name-asc");
    setSelectedCategory("");
    setCurrentPage(1);
    setIsSidebarOpen(false);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 max-w-7xl mx-auto">
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-gray-800 text-center">
        Explore Courses
      </h2>

      {/* Search Bar */}
      <div className="mb-6 sm:mb-8 flex justify-center">
        <div className="relative w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for courses..."
            className="w-full pl-10 pr-10 py-2 sm:py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-all duration-200"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none"
              aria-label="Clear search"
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8">
        {/* Sidebar Toggle Button for Mobile */}
        <button
          className="lg:hidden mb-4 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? "Hide Filters" : "Show Filters"}
        </button>

        {/* Sidebar Filters */}
        <aside
          className={`w-full lg:w-1/4 space-y-4 sm:space-y-6 transition-all duration-300 lg:block ${
            isSidebarOpen ? "block" : "hidden"
          }`}
        >
          <div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold border-b pb-1 sm:pb-2 mb-2 sm:mb-3 text-gray-800">
              Category
            </h3>
            <ul className="space-y-1 sm:space-y-1.5">
              {categories.map((cat) => (
                <li
                  key={cat._id}
                  onClick={() => {
                    setSelectedCategory(cat._id);
                    setCurrentPage(1);
                    setIsSidebarOpen(false);
                  }}
                  className={`cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm md:text-base transition-colors duration-200 ${
                    selectedCategory === cat._id
                      ? "bg-teal-600 text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {cat.categoryName}
                </li>
              ))}
            </ul>
          </div>

          {/* Sort Filter */}
          <div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold border-b pb-1 sm:pb-2 mb-2 sm:mb-3 text-gray-800">
              Sort
            </h3>
            <ul className="space-y-1 sm:space-y-1.5">
              {[
                { value: "price-asc" as const, label: "Price: Low to High" },
                { value: "price-desc" as const, label: "Price: High to Low" },
                { value: "name-asc" as const, label: "A - Z" },
                { value: "name-desc" as const, label: "Z - A" },
              ].map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    setSortOption(option.value);
                    setIsSidebarOpen(false);
                  }}
                  className={`cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm md:text-base transition-colors duration-200 ${
                    sortOption === option.value
                      ? "bg-teal-600 text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleClearFilters}
            className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Clear Filters
          </button>
        </aside>

        {/* Courses Grid */}
        <main className="w-full lg:w-3/4">
          <p className="mb-2 sm:mb-4 text-sm sm:text-base text-gray-600">
            We found <strong>{courses.length}</strong> items for you!
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(coursesPerPage)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-3 sm:p-4 animate-pulse"
                >
                  <div className="h-32 sm:h-40 bg-gray-200 rounded-lg mb-2 sm:mb-3"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-1 sm:mb-2"></div>
                  <div className="h-2 sm:h-3 bg-gray-200 rounded w-full mb-1 sm:mb-2"></div>
                  <div className="h-2 sm:h-3 bg-gray-200 rounded w-5/6 mb-2 sm:mb-3"></div>
                  <div className="flex justify-between space-x-2">
                    <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center text-gray-500 text-sm sm:text-base py-8 sm:py-12">
              No courses found
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {courses.map((course) => (
                  <CourseCard
                    key={course.courseId}
                    id={course.courseId}
                    title={course.courseName}
                    description={course.description}
                    originalPrice={course.originalPrice}
                    discountedPrice={course.discountedPrice}
                    duration={course.duration}
                    level={course.level}
                    thumbnailUrl={course.thumbnailUrl}
                    categoryName={course.categoryName}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 sm:mt-8 md:mt-10 gap-2 sm:gap-3 flex-wrap">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-xs sm:text-sm transition-colors duration-200 ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseListPage;