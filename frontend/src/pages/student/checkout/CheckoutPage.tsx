import { useEffect, useState } from "react";
import {
  getCart,
  initiateCheckout,
  checkoutCompleted,
  removeFromCart,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

interface Course {
  _id: string;
  courseName: string;
  price: number;
  thumbnailUrl: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CheckoutPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "wallet">("razorpay"); // ✅ added
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartCourses();
  }, []);

  const fetchCartCourses = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      setCourses(response?.data?.courses || []);
    } catch (error) {
      toast.error("Failed to load cart for checkout.");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = courses.reduce((sum, c) => sum + c.price, 0);

  const handlePayment = async () => {
    try {
      if (courses.length === 0) {
        toast.warn("No courses to checkout.");
        return;
      }

      const courseIds = courses.map((c) => c._id);

      const response = await initiateCheckout(courseIds, totalAmount, paymentMethod); // ✅ pass method
      const order = response?.order;

      if (paymentMethod === "wallet") {
        toast.success("Payment successful via wallet! You've been enrolled.");
        navigate("/user/enrolled");
        return;
      }

      // Razorpay flow
      if (!order || !order.gatewayOrderId) {
        toast.error("Failed to initiate order with Razorpay.");
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount * 100,
        currency: "INR",
        name: "ULearn",
        description: "Course Purchase",
        order_id: order.gatewayOrderId,
        handler: async function (razorpayResponse: any) {
          try {
            await checkoutCompleted({
              orderId: order._id,
              paymentId: razorpayResponse.razorpay_payment_id,
              method: "razorpay",
              amount: order.amount,
            });

            toast.success("Payment successful! You've been enrolled.");
            navigate("/user/enrolled");
          } catch (err) {
            toast.error("Payment verification failed.");
          }
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      const errorMessage = error?.response?.data?.message;

      if (errorMessage?.includes("already enrolled")) {
        toast.error(errorMessage);
        return;
      } else if (errorMessage?.includes("Insufficient wallet balance")) {
        toast.error("Insufficient wallet balance.");
        return;
      }

      toast.error("Payment initiation failed.");
    }
  };

  const handleRemove = async (courseId: string, courseName: string) => {
    try {
      await removeFromCart(courseId);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      toast.info(`${courseName} removed from cart.`);
    } catch {
      toast.error("Failed to remove course.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🧾 Checkout Summary</h2>

      {loading ? (
        <p>Loading...</p>
      ) : courses.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Thumbnail</th>
                  <th className="py-3 px-4 text-left">Course</th>
                  <th className="py-3 px-4 text-right">Price (₹)</th>
                  <th className="py-3 px-4 text-center">Action</th>
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
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleRemove(course._id, course.courseName)}
                        className="text-red-500 hover:underline text-sm"
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
                    Total
                  </td>
                  <td className="py-3 px-4 text-right">₹{totalAmount}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ✅ Payment Method Selection */}
          <div className="mt-6">
            <label className="font-medium mr-4">Choose Payment Method:</label>
            <label className="mr-6">
              <input
                type="radio"
                value="razorpay"
                checked={paymentMethod === "razorpay"}
                onChange={() => setPaymentMethod("razorpay")}
                className="mr-2"
              />
              Razorpay
            </label>
            <label>
              <input
                type="radio"
                value="wallet"
                checked={paymentMethod === "wallet"}
                onChange={() => setPaymentMethod("wallet")}
                className="mr-2"
              />
              Wallet
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handlePayment}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded text-sm"
            >
              Pay Now
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutPage;
