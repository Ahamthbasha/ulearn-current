import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  addToCart,
  getCart,
  addToWishlist,
  removeFromWishlist,
  courseAlreadyExistInWishlist, // Replace with learning path-specific API if needed
} from "../../api/action/StudentAction";
import { Heart, ShoppingCart } from "lucide-react";
import { isStudentLoggedIn } from "../../utils/auth";
import {type LearningPathCardProps } from "../../pages/student/interface/studentInterface";

const LearningPathCard: React.FC<LearningPathCardProps> = ({
  id,
  title,
  description,
  totalPrice,
  thumbnailUrl,
  courses,
  categoryName,
}) => {
  const navigate = useNavigate();
  const [isInCart, setIsInCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    if (!isStudentLoggedIn()) return;

    const fetchStatuses = async () => {
      try {
        const cartRes = await getCart(); // Update to check learning paths in cart
        const existsInCart = cartRes?.data && Array.isArray(cartRes.data)
          ? cartRes.data.some((item: any) => item.learningPathId === id) // Adjust for learning path
          : false;
        setIsInCart(existsInCart);

        const wishRes = await courseAlreadyExistInWishlist(id); // Replace with learning path-specific API
        setIsInWishlist(wishRes?.exists || false);
      } catch (err) {
        console.error("Failed to fetch cart/wishlist status:", err);
      }
    };

    fetchStatuses();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isStudentLoggedIn()) {
      toast.info("Please log in to add learning paths to your cart");
      return;
    }

    try {
      const res = await addToCart(id); // Update to add learning path to cart
      toast.success(res.message || "Learning path added to cart");
      setIsInCart(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add to cart");
    }
  };

  const handleAddToWishlist = async () => {
    if (!isStudentLoggedIn()) {
      toast.info("Please log in to use the wishlist");
      return;
    }

    try {
      const res = await addToWishlist(id); // Update to add learning path to wishlist
      toast.success(res.message || "Added to wishlist");
      setIsInWishlist(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add to wishlist");
    }
  };

  const handleRemoveFromWishlist = async () => {
    try {
      const res = await removeFromWishlist(id); // Update to remove learning path from wishlist
      toast.success(res.message || "Removed from wishlist");
      setIsInWishlist(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to remove from wishlist");
    }
  };

  // Calculate total duration from courses
  const totalDuration = courses.reduce((sum, course) => sum + parseFloat(course.duration || "0"), 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border flex flex-col max-w-sm mx-auto sm:max-w-md lg:max-w-lg overflow-hidden">
      <div className="relative group h-40 sm:h-48 lg:h-52 overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={title}
          loading="lazy"
          className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-grow gap-3">
        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 line-clamp-1">{title}</h3>
        <p className="text-sm sm:text-base text-gray-600 line-clamp-2 leading-relaxed">{description}</p>
        {categoryName && (
          <p className="text-sm text-gray-500">Category: {categoryName}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
          <span className="flex items-center gap-1">
            <span className="text-gray-500">📚</span> {courses.length} {courses.length === 1 ? "Course" : "Courses"}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-gray-500">🕒</span> {totalDuration.toFixed(1)} hrs
          </span>
          <div className="flex items-center gap-2">
            <span className="text-gray-800 font-bold text-lg">₹{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-3 mt-auto">
          {isInCart ? (
            <button
              onClick={() => navigate("/user/cart")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-md flex items-center gap-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              <ShoppingCart size={16} />
              Go to Cart
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-md flex items-center gap-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          )}

          <button
            className={`transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
              isInWishlist ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"
            }`}
            title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            onClick={isInWishlist ? handleRemoveFromWishlist : handleAddToWishlist}
          >
            <Heart size={20} fill={isInWishlist ? "currentColor" : "none"} />
          </button>

          <button
            onClick={() => navigate(`/user/learning-path/${id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningPathCard;