import { useEffect, useState } from "react";
import {
  getWishlist,
  removeFromWishlist,
  addToCart,
  getCart,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

interface WishlistItem {
  courseId: string;
  courseName: string;
  thumbnailUrl: string;
  price: number;
}

interface CartItem {
  courseId: string;
  courseName: string;
  thumbnailUrl: string;
  price: number;
}

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
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">❤️ My Wishlist</h2>

      {wishlist.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          <p className="mb-4">No courses in wishlist.</p>
          <button
            onClick={() => navigate("/user/courses")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 border">Thumbnail</th>
                <th className="p-3 border">Course Name</th>
                <th className="p-3 border">Price</th>
                <th className="p-3 border">Cart Action</th>
                <th className="p-3 border">Wishlist Action</th>
              </tr>
            </thead>
            <tbody>
              {wishlist.map((course) => {
                const isInCart = cartCourseIds.includes(course.courseId);

                return (
                  <tr key={course.courseId} className="hover:bg-gray-50">
                    <td className="p-3 border">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.courseName}
                        className="w-24 h-16 object-cover rounded"
                      />
                    </td>
                    <td className="p-3 border font-medium">
                      {course.courseName}
                    </td>
                    <td className="p-3 border">₹{course.price}</td>
                    <td className="p-3 border">
                      {isInCart ? (
                        <button
                          onClick={() => navigate("/user/cart")}
                          className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
                        >
                          Go to Cart
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(course.courseId)}
                          className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-sm"
                        >
                          Add to Cart
                        </button>
                      )}
                    </td>
                    <td className="p-3 border">
                      <button
                        onClick={() => handleRemoveFromWishlist(course.courseId)}
                        className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm"
                      >
                        Remove
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
  );
};

export default WishlistPage;
