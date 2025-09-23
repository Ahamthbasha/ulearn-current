import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  courseDetail,
  getCart,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  courseAlreadyExistInWishlist,
} from "../../../api/action/StudentAction";
import { Heart, ShoppingCart } from "lucide-react";
import { isStudentLoggedIn } from "../../../utils/auth";
import { type CourseDetail, type CartItem } from "../interface/studentInterface";

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isInCart, setIsInCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await courseDetail(courseId!);
        const courseData = res.data;

        setCourse(courseData);

        if (isStudentLoggedIn()) {
          const cartRes = await getCart();
          const inCart = cartRes?.data && Array.isArray(cartRes.data)
            ? cartRes.data.some((course: CartItem) => course.courseId === courseId)
            : false;
          setIsInCart(inCart);

          const wishRes = await courseAlreadyExistInWishlist(courseId!);
          setIsInWishlist(wishRes.exists);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch course details");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchData();
  }, [courseId]);

  const handleAddToCart = async () => {
    if (!isStudentLoggedIn()) {
      toast.info("Please log in to add to cart");
      return;
    }

    try {
      await addToCart(courseId!);
      toast.success("Course added to cart");
      setIsInCart(true);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.info("Course is already in cart");
        setIsInCart(true);
      } else {
        toast.error("Failed to add to cart");
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

  if (loading) return <div className="text-center py-6 sm:py-8 md:py-10">Loading...</div>;

  if (!course)
    return (
      <div className="text-center py-6 sm:py-8 md:py-10 text-red-500 text-lg sm:text-xl">Course not found</div>
    );

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 font-sans">
      {/* Course Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 bg-white shadow-lg rounded-xl p-4 sm:p-6 md:p-8">
        {/* Thumbnail */}
        <div className="relative w-full">
          <img
            src={course.thumbnailUrl}
            alt={course.courseName}
            className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-lg shadow-md"
          />
        </div>

        {/* Course Info */}
        <div className="flex flex-col justify-between space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
              {course.courseName}
              <button
                onClick={handleWishlistToggle}
                className="text-red-500 hover:text-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-500"
                title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  size={24}
                  className={isInWishlist ? "fill-red-500" : ""}
                />
              </button>
            </h2>
            <p className="text-gray-700 text-sm sm:text-base mt-2 sm:mt-3 line-clamp-3">{course.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 sm:gap-y-3 text-gray-800 text-sm sm:text-base mt-4 sm:mt-6">
              <p><strong>Instructor:</strong> {course.instructorName}</p>
              <p><strong>Category:</strong> {course.categoryName}</p>
              <p><strong>Duration:</strong> {course.duration} hrs</p>
              <p><strong>Level:</strong> {course.level}</p>
              <p><strong>Price:</strong> ₹{course.price}</p>
              <p><strong>Chapters:</strong> {course.chapterCount}</p>
              <p><strong>Quiz Questions:</strong> {course.quizQuestionCount}</p>
            </div>
          </div>

          {isInCart ? (
            <button
              onClick={() => navigate("/user/cart")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 sm:px-6 rounded-md shadow mt-4 sm:mt-6 w-full sm:w-auto flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <ShoppingCart size={16} />
              Go to Cart
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 sm:px-6 rounded-md shadow mt-4 sm:mt-6 w-full sm:w-auto flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          )}
        </div>
      </div>

      {/* Demo Video */}
      {course.demoVideoUrl && (
        <div className="mt-8 sm:mt-10 md:mt-12">
          <h3 className="text-xl sm:text-2xl md:text-2xl font-semibold mb-4 sm:mb-6 text-gray-900">
            Watch Demo Video
          </h3>
          <video
            controls
            className="w-full rounded-xl shadow-md max-h-[300px] sm:max-h-[400px] md:max-h-[500px] object-cover"
            src={course.demoVideoUrl}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;