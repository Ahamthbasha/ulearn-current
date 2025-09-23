import { useEffect, useState } from "react";
import {
  getWishlist,
  removeFromWishlist,
  addToCart,
  getCart,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";

import { type WishlistItem, type CartItem } from "../interface/studentInterface";

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [cartCourseIds, setCartCourseIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
    fetchCartItems();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await getWishlist();
      if (response?.data) {
        setWishlist(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch wishlist");
    }
  };

  const fetchCartItems = async () => {
    try {
      const cart = await getCart();
      if (cart?.data && Array.isArray(cart.data)) {
        // Extract courseIds from the cart data array
        const ids = cart.data.map((course: CartItem) => course.courseId);
        setCartCourseIds(ids);
      }
    } catch (error) {
      toast.error("Failed to fetch cart");
    }
  };

  const handleAddToCart = async (courseId: string) => {
    try {
      await addToCart(courseId);
      toast.success("Added to cart");
      fetchCartItems(); // Refresh cart items to update the UI
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleRemoveFromWishlist = async (courseId: string) => {
    try {
      await removeFromWishlist(courseId);
      toast.success("Removed from wishlist");
      fetchWishlist(); // Refresh wishlist to update the UI
    } catch (error) {
      toast.error("Failed to remove from wishlist");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 flex items-center">
          <Heart className="mr-2 text-red-500" /> ❤️ My Wishlist
        </h2>

        {wishlist.length === 0 ? (
          <div className="text-center p-6 sm:p-8 bg-white rounded-lg shadow-md mt-10">
            <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="mb-4 text-gray-600 text-lg">No courses in wishlist.</p>
            <button
              onClick={() => navigate("/user/courses")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-md text-sm sm:text-base w-full sm:w-auto"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full sm:w-auto border border-gray-300 bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 sm:p-3 md:p-4 border-b text-left">Thumbnail</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-left">Course Name</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-left">Price</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-left">Cart Action</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-left">Wishlist Action</th>
                </tr>
              </thead>
              <tbody>
                {wishlist.map((course) => {
                  const isInCart = cartCourseIds.includes(course.courseId);

                  return (
                    <tr
                      key={course.courseId}
                      className="hover:bg-gray-50 transition duration-300"
                    >
                      <td className="p-2 sm:p-3 md:p-4 border-b">
                        <img
                          src={course.thumbnailUrl}
                          alt={course.courseName}
                          className="w-20 h-12 sm:w-24 sm:h-16 object-cover rounded-lg"
                        />
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 border-b font-medium text-gray-800">
                        {course.courseName}
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 border-b text-gray-700">₹{course.price}</td>
                      <td className="p-2 sm:p-3 md:p-4 border-b">
                        {isInCart ? (
                          <button
                            onClick={() => navigate("/user/cart")}
                            className="flex items-center justify-center w-full sm:w-auto px-2 py-1 sm:px-3 sm:py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-sm shadow-md transition duration-300"
                          >
                            <ShoppingCart className="mr-1 h-4 w-4" /> Go to Cart
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(course.courseId)}
                            className="flex items-center justify-center w-full sm:w-auto px-2 py-1 sm:px-3 sm:py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm shadow-md transition duration-300"
                          >
                            <ShoppingCart className="mr-1 h-4 w-4" /> Add to Cart
                          </button>
                        )}
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 border-b">
                        <button
                          onClick={() => handleRemoveFromWishlist(course.courseId)}
                          className="flex items-center justify-center w-full sm:w-auto px-2 py-1 sm:px-3 sm:py-2 rounded bg-red-500 hover:bg-red-600 text-white text-sm shadow-md transition duration-300"
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;