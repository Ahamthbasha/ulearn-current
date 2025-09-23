import { useEffect, useState } from "react";
import { getCart, removeFromCart } from "../../../api/action/StudentAction";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ShoppingCart, Trash2, IndianRupee } from "lucide-react";
import { type CartCourseDTO } from "../interface/studentInterface";

const CartPage = () => {
  const [courses, setCourses] = useState<CartCourseDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      setCourses(response?.data || []); // now data is the array itself
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (courseId: string) => {
    try {
      await removeFromCart(courseId);
      toast.success("Course removed from cart");
      setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
    } catch (error: any) {
      toast.error("Failed to remove course from cart");
    }
  };

  const totalPrice = courses.reduce((sum, course) => sum + course.price, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 flex items-center">
          <ShoppingCart className="mr-2 text-blue-600" /> 🛒 Your Cart
        </h2>

        {loading ? (
          <div className="text-center text-gray-600 mt-10">
            <p className="mb-4 text-lg">Loading your cart...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center p-6 sm:p-8 bg-white rounded-lg shadow-md mt-10">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="mb-4 text-gray-600 text-lg">Your cart is empty.</p>
            <button
              onClick={() => navigate("/user/courses")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-md text-sm sm:text-base w-full sm:w-auto"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full sm:w-auto bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-left border-b">Thumbnail</th>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-left border-b">Course Name</th>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-right border-b">Price (₹)</th>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-right border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.courseId} className="border-b hover:bg-gray-50 transition duration-300">
                      <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6">
                        <img
                          src={course.thumbnailUrl}
                          alt={course.courseName}
                          className="w-16 h-10 sm:w-20 sm:h-14 object-cover rounded-lg"
                        />
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-gray-800">{course.courseName}</td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-right text-gray-700">
                        <IndianRupee className="inline h-4 w-4 mr-1" /> {course.price}
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-right">
                        <button
                          onClick={() => handleRemove(course.courseId)}
                          className="flex items-center justify-center w-full sm:w-auto px-2 py-1 sm:px-3 sm:py-2 rounded bg-red-500 hover:bg-red-600 text-white text-sm shadow-md transition duration-300"
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-right border-t" colSpan={2}>
                      Total:
                    </td>
                    <td className="py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 text-right border-t text-gray-900">
                      <IndianRupee className="inline h-4 w-4 mr-1" /> {totalPrice}
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
                Browse More
              </button>

              <button
                onClick={() => navigate("/user/checkout")}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-md text-sm sm:text-base w-full sm:w-auto"
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