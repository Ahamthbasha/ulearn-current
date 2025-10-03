import { useEffect, useState } from "react";
import { allCourses } from "../api/action/StudentAction";
import CourseCard from "../components/StudentComponents/CourseCard";
import Banner from "../components/Banner";
import { useNavigate } from "react-router-dom";
import { type LandingPageCourse } from "./student/interface/studentInterface";

const LandingPage = () => {
  const [courses, setCourses] = useState<LandingPageCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await allCourses();
        setCourses(response.data || []);
      } catch (error) {
        console.error("Error fetching courses", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="font-sans min-h-screen bg-gray-50">
      <Banner />

      <main className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 md:mb-10 text-gray-800 text-center">
          Available Courses
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-4 animate-pulse"
              >
                <div className="h-40 sm:h-48 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center text-gray-500 text-sm sm:text-base py-12">
            No courses available
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {courses.slice(0, 8).map((course) => (
                <CourseCard
                  key={course.courseId}
                  id={course.courseId}
                  title={course.courseName}
                  description={course.description}
                  price={course.price}
                  originalPrice={course.originalPrice}
                  duration={course.duration}
                  level={course.level}
                  thumbnailUrl={course.thumbnailUrl}
                  categoryName={course.categoryName}
                />
              ))}
            </div>

            {/* Browse More Button */}
            {courses.length > 8 && (
              <div className="text-center mt-8 sm:mt-10 md:mt-12">
                <button
                  onClick={() => navigate("/user/courses")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Browse More
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default LandingPage;