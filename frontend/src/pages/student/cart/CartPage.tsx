import { useEffect, useState } from "react";
import { getCart, removeFromCart } from "../../../api/action/StudentAction";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface Course {
  _id: string;
  courseName: string;
  price: number;
  thumbnailUrl: string;
}

const CartPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      setCourses(response?.data?.courses || []);
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
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
    } catch (error: any) {
      toast.error("Failed to remove course from cart");
    }
  };

  const totalPrice = courses.reduce((sum, course) => sum + course.price, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🛒 Your Cart</h2>

      {loading ? (
        <p>Loading...</p>
      ) : courses.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          <p className="mb-4">Your cart is empty.</p>
          <button
            onClick={() => navigate("/user/courses")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg shadow-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Thumbnail</th>
                  <th className="py-3 px-4 text-left">Course Name</th>
                  <th className="py-3 px-4 text-right">Price (₹)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id} className="border-t">
                    <td className="py-3 px-4">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.courseName}
                        className="w-20 h-14 object-cover rounded"
                      />
                    </td>
                    <td className="py-3 px-4">{course.courseName}</td>
                    <td className="py-3 px-4 text-right">₹{course.price}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemove(course._id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-4 text-right" colSpan={2}>
                    Total:
                  </td>
                  <td className="py-3 px-4 text-right">₹{totalPrice}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => navigate("/user/courses")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm"
            >
              Browse More
            </button>

            <button
              onClick={() => navigate("/user/checkout")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
