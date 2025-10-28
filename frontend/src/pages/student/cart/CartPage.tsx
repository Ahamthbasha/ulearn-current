import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCart, removeFromCart } from "../../../api/action/StudentAction";
import { ShoppingCart, Trash2, IndianRupee } from "lucide-react";
import { type CartItemDTO } from "../../../types/interfaces/IStudentInterface";

const CartPage = () => {
  const [items, setItems] = useState<CartItemDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      const cart = response || [];
      setItems(cart);
      // Show toasts for enrolled items
      const enrolledMessages = cart
        .map((item: CartItemDTO) => {
          if (item.type === "course" && item.isAlreadyEnrolled) {
            return `"${item.title}" is already enrolled and will not be charged.`;
          }
          if (item.type === "learningPath" && item.enrolledCourses && item.enrolledCourses.length > 0) {
            return `Some courses in "${item.title}" are already enrolled and will not be charged.`;
          }
          if (item.type === "learningPath" && item.price === 0) {
            return `All courses in "${item.title}" are already enrolled. Please remove this learning path.`;
          }
          return null;
        })
        .filter((msg): msg is string => msg !== null);
      if (enrolledMessages.length > 0) {
        toast.info(enrolledMessages.join(" "), { autoClose: 7000 });
      }
      toast.success("Cart fetched successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId: string, type: "course" | "learningPath", title: string) => {
    try {
      setIsRemoving(itemId);
      const response = await removeFromCart(itemId, type);
      const cart = response || [];
      setItems(cart);
      toast.success(`${title} removed from cart.`);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "Failed to remove item.";
      if (errorMessage.includes("already enrolled")) {
        toast.info(`${title} is already enrolled, removing from cart.`);
        setItems((prev) => prev.filter((item) => item.itemId !== itemId));
      } else {
        toast.error(`Failed to remove ${title} from cart: ${errorMessage}`);
      }
    } finally {
      setIsRemoving(null);
    }
  };

  const totalPrice = items.reduce((sum, item) => {
    if (item.isAlreadyEnrolled && item.type === "course") return sum;
    return sum + item.price;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 flex items-center">
          🛒 Your Cart
        </h2>

        {loading ? (
          <div className="text-center text-gray-600 mt-10">
            <p className="mb-4 text-lg">Loading your cart...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center p-6 sm:p-8 bg-white rounded-lg shadow-md mt-10">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="mb-4 text-gray-600 text-lg">Your cart is empty.</p>
            <button
              onClick={() => navigate("/user/courses")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-md text-sm sm:text-base w-full sm:w-auto"
            >
              Browse Courses
            </button>
            <button
              onClick={() => navigate("/user/createdLms")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-md text-sm sm:text-base w-full sm:w-auto mt-4 sm:mt-0 sm:ml-4"
            >
              Browse Learning Paths
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full sm:w-auto bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-left border-b">Thumbnail</th>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-left border-b">Item Name</th>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-left border-b">Type</th>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-right border-b">Price (₹)</th>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-right border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.itemId} className="border-b hover:bg-gray-50 transition duration-300">
                      <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-16 h-10 sm:w-20 sm:h-14 object-cover rounded-lg"
                          onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
                        />
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-gray-800">
                        <div>
                          {item.title}
                          {item.isAlreadyEnrolled && item.type === "course" && (
                            <div className="text-xs text-green-600 mt-1">
                              Already enrolled - no additional cost
                            </div>
                          )}
                          {item.type === "learningPath" && item.enrolledCourses && item.enrolledCourses.length > 0 && (
                            <div className="text-xs text-green-600 mt-1">
                              Some courses already enrolled - excluded from total
                            </div>
                          )}
                          {item.type === "learningPath" && item.price === 0 && (
                            <div className="text-xs text-yellow-600 mt-1">
                              All courses enrolled - please remove this learning path
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-gray-700">
                        {item.type === "course" ? "Course" : "Learning Path"}
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-right text-gray-700">
                        <div className="flex items-center justify-end">
                          <IndianRupee className="inline h-4 w-4 mr-1" /> {item.price.toLocaleString()}
                        </div>
                        {item.isAlreadyEnrolled && item.type === "course" && (
                          <div className="text-sm text-gray-500">
                            Effective: ₹0
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-right">
                        <button
                          onClick={() => handleRemove(item.itemId, item.type, item.title)}
                          className="flex items-center justify-center w-full sm:w-auto px-2 py-1 sm:px-3 sm:py-2 rounded bg-red-500 hover:bg-red-600 text-white text-sm shadow-md transition duration-300 disabled:opacity-50"
                          disabled={isRemoving === item.itemId}
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-right border-t" colSpan={3}>
                      Total:
                    </td>
                    <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-right border-t text-gray-900">
                      <IndianRupee className="inline h-4 w-4 mr-1" /> {totalPrice.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 border-t"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between flex-col sm:flex-row gap-4 sm:gap-6 mt-6 sm:mt-8">
              <button
                onClick={() => navigate("/user/courses")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-md text-sm sm:text-base w-full sm:w-auto"
              >
                Browse Courses
              </button>
              <button
                onClick={() => navigate("/user/createdLms")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-md text-sm sm:text-base w-full sm:w-auto"
              >
                Browse Learning Paths
              </button>
              <button
                onClick={() => navigate("/user/checkout")}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-md text-sm sm:text-base w-full sm:w-auto"
                disabled={items.some((item) => item.type === "learningPath" && item.price === 0)}
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;