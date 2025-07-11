import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  courseDetail,
  getCart,
  addToCart,
  removeFromCart,
} from "../../../api/action/StudentAction";

import {
  addToWishlist,
  removeFromWishlist,
  courseAlreadyExistInWishlist,
} from "../../../api/action/StudentAction";

import { Heart } from "lucide-react";
import { isStudentLoggedIn } from "../../../utils/auth"; // ✅ import login check

interface CourseDetail {
  _id: string;
  courseName: string;
  description: string;
  duration: string;
  level: string;
  price: number;
  thumbnailUrl: string;
  demoVideo: {
    type: "video";
    url: string;
  };
  category: {
    _id: string;
    categoryName: string;
  };
  instructorId: {
    _id: string;
    username: string;
  };
}

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [chapterCount, setChapterCount] = useState(0);
  const [quizQuestionCount, setQuizQuestionCount] = useState(0);
  const [isInCart, setIsInCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await courseDetail(courseId!);
        const { course, chapterCount, quizQuestionCount } = res.data;

        setCourse(course);
        setChapterCount(chapterCount);
        setQuizQuestionCount(quizQuestionCount);

        if (isStudentLoggedIn()) {
          const cartRes = await getCart();
          const inCart = cartRes?.data?.courses?.some((c: any) => c._id === courseId);
          setIsInCart(inCart);

          const wishRes = await courseAlreadyExistInWishlist(courseId!);
          setIsInWishlist(wishRes.exists);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchData();
  }, [courseId]);

  const handleCartToggle = async () => {
    if (!isStudentLoggedIn()) {
      toast.info("Please log in to manage your cart");
      return;
    }

    try {
      if (!courseId) return;

      if (isInCart) {
        await removeFromCart(courseId);
        toast.success("Course removed from cart");
        setIsInCart(false);
      } else {
        await addToCart(courseId);
        toast.success("Course added to cart");
        setIsInCart(true);
      }
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.info("Course is already in cart");
        setIsInCart(true);
      } else {
        toast.error("Cart operation failed");
      }
    }
  };

  const handleWishlistToggle = async () => {
    if (!isStudentLoggedIn()) {
      toast.info("Please log in to manage your wishlist");
      return;
    }

    try {
      if (!courseId) return;

      if (isInWishlist) {
        await removeFromWishlist(courseId);
        toast.success("Removed from wishlist");
        setIsInWishlist(false);
      } else {
        await addToWishlist(courseId);
        toast.success("Added to wishlist");
        setIsInWishlist(true);
      }
    } catch (error: any) {
      toast.error("Wishlist operation failed");
      console.error(error);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  if (!course)
    return (
      <div className="text-center py-10 text-red-500">Course not found</div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 font-sans">
      {/* Course Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white shadow-lg rounded-xl p-8">
        {/* Thumbnail */}
        <div className="relative">
          <img
            src={course.thumbnailUrl}
            alt={course.courseName}
            className="w-full h-64 object-cover rounded-lg shadow-md"
          />
        </div>

        {/* Course Info */}
        <div className="flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              {course.courseName}
              <button
                onClick={handleWishlistToggle}
                className="text-red-500 hover:text-red-600 transition"
                title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  size={28}
                  className={isInWishlist ? "fill-red-500" : ""}
                />
              </button>
            </h2>
            <p className="text-gray-700 text-sm mt-2">{course.description}</p>

            <div className="grid grid-cols-2 gap-y-2 text-gray-800 text-sm mt-4">
              <p>
                <strong>Instructor:</strong> {course.instructorId.username}
              </p>
              <p>
                <strong>Category:</strong> {course.category.categoryName}
              </p>
              <p>
                <strong>Duration:</strong> {course.duration}
              </p>
              <p>
                <strong>Level:</strong> {course.level}
              </p>
              <p>
                <strong>Price:</strong> ₹{course.price}
              </p>
              <p>
                <strong>Chapters:</strong> {chapterCount}
              </p>
              <p>
                <strong>Quiz Questions:</strong> {quizQuestionCount}
              </p>
            </div>
          </div>

          <button
            onClick={handleCartToggle}
            className={`${
              isInCart
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white font-semibold py-2 px-6 rounded-md shadow mt-6 w-fit`}
          >
            {isInCart ? "Remove From Cart" : "Add To Cart"}
          </button>
        </div>
      </div>

      {/* Demo Video */}
      {course.demoVideo?.url && (
        <div className="mt-14">
          <h3 className="text-2xl font-semibold mb-4 text-gray-900">
            Watch Demo Video
          </h3>
          <video
            controls
            className="w-full rounded-xl shadow-md max-h-[500px] object-cover"
            src={course.demoVideo.url}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;
