import { useEffect, useState } from "react";
import { allCourses } from "../api/action/StudentAction";
import CourseCard from "../components/StudentComponents/CourseCard";
import Banner from "../components/Banner";
import { useNavigate } from "react-router-dom";

interface CourseResponse {
  course: {
    _id: string;
    courseName: string;
    description: string;
    price: number;
    duration: string;
    level: string;
    thumbnailUrl: string;
  };
  chapterCount: number;
  quizQuestionCount: number;
}

const LandingPage = () => {
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await allCourses();
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="font-sans">
      <Banner />

      <main className="my-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Available Courses
        </h2>

        {loading ? (
          <div className="text-center text-gray-500">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center text-gray-500">No courses available</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {courses.slice(0, 8).map(({ course }) => (
                <CourseCard
                  key={course._id}
                  id={course._id}
                  title={course.courseName}
                  description={course.description}
                  price={course.price}
                  duration={course.duration}
                  level={course.level}
                  thumbnailUrl={course.thumbnailUrl}
                />
              ))}
            </div>

            {/* Browse More Button */}
            {courses.length > 1 && (
              <div className="text-center mt-10">
                <button
                  onClick={() => navigate("/user/courses")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
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
