import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  GetLmsCourseDetail,
  addToCart,
  addToWishlist,
  removeFromWishlist,
} from "../../../api/action/StudentAction";
import { Heart, ShoppingCart } from "lucide-react";
import { isStudentLoggedIn } from "../../../utils/auth";
import {type LearningPathDetail } from "../interface/studentInterface";

const LearningPathDetailPage = () => {
  const { learningPathId } = useParams<{ learningPathId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [learningPath, setLearningPath] = useState<LearningPathDetail | null>(null);
  const [isInCart, setIsInCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await GetLmsCourseDetail(learningPathId!);
        const learningPathData = res.data;

        setLearningPath(learningPathData);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch learning path details");
      } finally {
        setLoading(false);
      }
    };

    if (learningPathId) fetchData();
  }, [learningPathId]);

  const handleAddToCart = async () => {
    if (!isStudentLoggedIn()) {
      toast.info("Please log in to add to cart");
      return;
    }

    try {
      await addToCart(learningPathId!);
      toast.success("Learning path added to cart");
      setIsInCart(true);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.info("Learning path is already in cart");
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
      if (!learningPathId) return;

      if (isInWishlist) {
        await removeFromWishlist(learningPathId);
        toast.success("Removed from wishlist");
        setIsInWishlist(false);
      } else {
        await addToWishlist(learningPathId);
        toast.success("Added to wishlist");
        setIsInWishlist(true);
      }
    } catch (error: any) {
      toast.error("Wishlist operation failed");
      console.error(error);
    }
  };

  if (loading) return <div className="text-center py-6 sm:py-8 md:py-10">Loading...</div>;

  if (!learningPath)
    return (
      <div className="text-center py-6 sm:py-8 md:py-10 text-red-500 text-lg sm:text-xl">
        Learning path not found
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 font-sans">
      {/* Learning Path Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 bg-white shadow-lg rounded-xl p-4 sm:p-6 md:p-8">
        {/* Thumbnail */}
        <div className="relative w-full">
          <img
            src={learningPath.learningPathThumbnailUrl}
            alt={learningPath.title}
            className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-lg shadow-md"
          />
        </div>

        {/* Learning Path Info */}
        <div className="flex flex-col justify-between space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
              {learningPath.title}
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
            <p className="text-gray-700 text-sm sm:text-base mt-2 sm:mt-3 line-clamp-3">{learningPath.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 sm:gap-y-3 text-gray-800 text-sm sm:text-base mt-4 sm:mt-6">
              <p><strong>Category:</strong> {learningPath.categoryName}</p>
              <p><strong>Number of Courses:</strong> {learningPath.noOfCourses}</p>
              <p><strong>Total Duration:</strong> {learningPath.hoursOfCourses} hrs</p>
              <p><strong>Total Price:</strong> ${learningPath.totalPrice}</p>
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

      {/* Courses List */}
      <div className="mt-6 sm:mt-8 md:mt-10 bg-white shadow-lg rounded-xl p-4 sm:p-6 md:p-8">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Courses in this Learning Path</h3>
        <ul className="space-y-3 sm:space-y-4">
          {learningPath.courses.map((course, index) => (
            <li key={course.courseId} className="text-gray-800 text-sm sm:text-base">
              <span className="font-semibold">{index + 1}. </span>
              <Link
                to={`/user/course/${course.courseId}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {course.courseName}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LearningPathDetailPage;