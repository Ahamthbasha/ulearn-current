import { useEffect, useState } from "react";
import {
  getWishlist,
  removeFromWishlist,
  addToCart,
  getCart,
  removeFromCart,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

interface Course {
  _id: string;
  courseName: string;
  thumbnailUrl: string;
  price: number;
}

interface WishlistItem {
  _id: string;
  courseId: Course | null;
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
      const validItems = response.data.filter((item: WishlistItem) => item.courseId !== null);
      setWishlist(validItems);
    } catch (error) {
      toast.error("Failed to fetch wishlist");
    }
  };

  const fetchCartItems = async () => {
    try {
      const cart = await getCart();
      if (cart?.data?.courses) {
        const ids = cart.data.courses.map((c: any) => c._id);
        setCartCourseIds(ids);
      }
    } catch (error) {
      toast.error("Failed to fetch cart");
    }
  };

  const handleRemoveFromWishlist = async (courseId: string) => {
    try {
      await removeFromWishlist(courseId);
      toast.success("Removed from wishlist");
      fetchWishlist();
    } catch (error) {
      toast.error("Failed to remove from wishlist");
    }
  };

  const toggleCart = async (courseId: string) => {
    try {
      if (cartCourseIds.includes(courseId)) {
        await removeFromCart(courseId);
        toast.success("Removed from cart");
      } else {
        await addToCart(courseId);
        toast.success("Added to cart");
      }
      fetchCartItems();
    } catch (error) {
      toast.error("Cart operation failed");
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
              {wishlist.map((item) => {
                const course = item.courseId!;
                const isInCart = cartCourseIds.includes(course._id);

                return (
                  <tr key={course._id} className="hover:bg-gray-50">
                    <td className="p-3 border">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.courseName}
                        className="w-24 h-16 object-cover rounded"
                      />
                    </td>
                    <td className="p-3 border font-medium">{course.courseName}</td>
                    <td className="p-3 border">₹{course.price}</td>
                    <td className="p-3 border">
                      <button
                        onClick={() => toggleCart(course._id)}
                        className={`px-3 py-1 rounded text-white text-sm ${
                          isInCart ? "bg-red-500" : "bg-green-600"
                        }`}
                      >
                        {isInCart ? "Remove from Cart" : "Add to Cart"}
                      </button>
                    </td>
                    <td className="p-3 border">
                      <button
                        onClick={() => handleRemoveFromWishlist(course._id)}
                        className="px-3 py-1 rounded bg-gray-300 text-black text-sm"
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
