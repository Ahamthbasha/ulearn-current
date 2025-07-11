import { useEffect, useState } from "react";
import { CoursesFiltered, getAllCategories } from "../../../api/action/StudentAction";
import CourseCard from "../../../components/StudentComponents/CourseCard";
import { toast } from "react-toastify";

interface Course {
  _id: string;
  courseName: string;
  description: string;
  price: number;
  duration: string;
  level: string;
  thumbnailUrl: string;
  category?: {
    _id: string;
    categoryName: string;
  };
}

interface CourseResponse {
  course: Course;
  chapterCount: number;
  quizQuestionCount: number;
}

interface Category {
  _id: string;
  categoryName: string;
}

const CourseListPage = () => {
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "price-asc" | "price-desc">("name-asc");

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
      const response = await CoursesFiltered(
        currentPage,
        coursesPerPage,
        debouncedSearch,
        sortOption,
        selectedCategory
      );

      const { data, total } = response;
      setCourses(data as CourseResponse[]);
      setTotalPages(Math.ceil(total / coursesPerPage));
    } catch (error) {
      toast.error("Failed to load courses");
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      toast.error("Failed to load categories");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSortOption("name-asc");
    setSelectedCategory("");
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold mb-6 text-center">Explore Courses</h2>

      {/* Centered Search Bar */}
      <div className="mb-10 flex justify-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for courses..."
          className="px-4 py-2 w-full sm:w-2/3 md:w-1/2 border rounded-lg shadow-sm"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-1/4 space-y-8">
          <div>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Category</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li
                  key={cat._id}
                  onClick={() => {
                    setSelectedCategory(cat._id);
                    setCurrentPage(1);
                  }}
                  className={`cursor-pointer px-3 py-1 rounded-md ${
                    selectedCategory === cat._id
                      ? "bg-teal-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {cat.categoryName}
                </li>
              ))}
            </ul>
          </div>

          {/* Sort Filter */}
          <div>
            <h3 className="text-lg font-semibold border-b pb-2 mb-3">Sort</h3>
            <ul className="space-y-2">
              <li onClick={() => setSortOption("price-asc")} className="cursor-pointer hover:underline">
                Price: Low to High
              </li>
              <li onClick={() => setSortOption("price-desc")} className="cursor-pointer hover:underline">
                Price: High to Low
              </li>
              <li onClick={() => setSortOption("name-asc")} className="cursor-pointer hover:underline">
                A - Z
              </li>
              <li onClick={() => setSortOption("name-desc")} className="cursor-pointer hover:underline">
                Z - A
              </li>
            </ul>
          </div>

          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded shadow"
          >
            Clear Filter
          </button>
        </aside>

        {/* Courses Grid */}
        <main className="w-full lg:w-3/4">
          <p className="mb-4">
            We found <strong>{courses.length}</strong> items for you!
          </p>

          {courses.length === 0 ? (
            <div className="text-center text-gray-500">No courses found</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map(({ course }) => (
                  <CourseCard
                    key={course._id}
                    id={course._id}
                    title={course.courseName}
                    description={course.description}
                    price={course.price}
                    duration={course.duration}
                    level={course.level}
                    thumbnailUrl={course.thumbnailUrl}
                    categoryName={course.category?.categoryName || ""}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-10 gap-2 flex-wrap">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`px-3 py-1 rounded border ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700"
                      }`}
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
