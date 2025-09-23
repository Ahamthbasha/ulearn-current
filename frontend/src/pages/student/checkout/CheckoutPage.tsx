import { useEffect, useState, useRef } from "react";
import {
  getCart,
  getWallet,
  initiateCheckout,
  checkoutCompleted,
  removeFromCart,
  cancelPendingOrder,
  markFailed,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { type Course, type Wallet } from "../interface/studentInterface";
import { debounce } from "lodash";

const CheckoutPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "wallet">("razorpay");
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  const [isCancelProcessing, setIsCancelProcessing] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const navigate = useNavigate();
  const razorpayInstanceRef = useRef<any>(null);

  const isProcessing = isRazorpayProcessing || isWalletProcessing || isCancelProcessing;

  useEffect(() => {
    fetchCartCourses();
    fetchWalletBalance();

    return () => {
      if (razorpayInstanceRef.current) {
        try {
          razorpayInstanceRef.current.close();
        } catch (e) {
          console.error("Error closing Razorpay modal:", e);
        }
      }
    };
  }, []);

  const fetchCartCourses = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      const coursesData: Course[] = (response?.data || []).map((course: any) => ({
        _id: course.courseId,
        courseName: course.courseName,
        price: course.price,
        thumbnailUrl: course.thumbnailUrl,
      }));
      setCourses(coursesData);
    } catch (error) {
      toast.error("Failed to load cart for checkout.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await getWallet();
      setWallet(res?.wallet || { balance: 0 });
    } catch (error) {
      toast.error("Failed to fetch wallet balance.");
    }
  };

  const totalAmount = courses.reduce((sum, c) => sum + c.price, 0);

  const handleBackendError = (error: any, paymentType: "razorpay" | "wallet") => {
    const errorMessage = error?.response?.data?.message || error?.response?.data?.errorMessage || error?.message;
    const orderId = error?.response?.data?.orderId || (error?.response?.data?.error && error?.response?.data?.error?.orderId);
    console.log("Backend error details:", {
      errorMessage,
      orderId,
      rawResponseData: error?.response?.data,
      fullError: error
    });

    if (errorMessage?.includes("A pending order already exists")) {
      toast.error(
        "A payment is already in progress for these courses. Cancel it to proceed with a new payment or wait 15 minutes for it to expire.",
      );
      if (orderId) {
        console.log("Setting pendingOrderId:", orderId);
        setPendingOrderId(orderId);
      } else {
        console.error("No orderId in pending order error response");
        toast.error("Unable to identify pending order. Please try again later.");
      }
    } else if (errorMessage?.includes("Remove") && errorMessage?.includes("already enrolled")) {
      toast.error(errorMessage);
      fetchCartCourses();
      navigate("/user/enrolled");
    } else if (errorMessage?.includes("Order already processed")) {
      toast.success("Payment already completed! Redirecting to enrolled courses.");
      navigate("/user/enrolled");
    } else if (
      errorMessage?.includes("already enrolled") ||
      errorMessage?.includes("Payment cancelled")
    ) {
      toast.error(errorMessage);
      navigate("/user/enrolled");
    } else if (errorMessage?.includes("Order failed earlier")) {
      toast.error("This order failed previously. Please start a new checkout.");
      navigate("/user/cart");
    } else if (errorMessage?.includes("Order was cancelled")) {
      toast.error("This order was cancelled. Please start a new checkout.");
      navigate("/user/cart");
    } else if (errorMessage?.includes("Insufficient wallet balance")) {
      toast.error("Insufficient wallet balance. Please use Razorpay or recharge your wallet.");
    } else if (errorMessage?.includes("Order not found")) {
      toast.error("Order not found. Please try again.");
      navigate("/user/cart");
    } else {
      toast.error(
        `${paymentType === "razorpay" ? "Payment" : "Wallet payment"} failed. Please try again.`,
      );
    }
  };

  const handleCancelPendingOrder = async () => {
    if (!pendingOrderId) {
      toast.error("No pending order to cancel.");
      return;
    }

    setIsCancelProcessing(true);
    try {
      await cancelPendingOrder(pendingOrderId);
      toast.success("Pending order cancelled successfully. You can now proceed with a new payment.");
      setPendingOrderId(null);
    } catch (error: any) {
      console.error("Cancel pending order error:", error);
      toast.error(error?.response?.data?.message || "Failed to cancel pending order.");
    } finally {
      setIsCancelProcessing(false);
    }
  };

  const markOrderAsFailed = async (orderId: string) => {
    try {
      await markFailed(orderId);
      toast.error("Payment failed. Order marked as failed.");
      navigate("/user/order", { replace: true });
    } catch (error: any) {
      console.error("Failed to mark order as failed:", error);
      toast.error(error?.response?.data?.message || "Failed to mark order as failed.");
    } finally {
      setIsRazorpayProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (isProcessing) {
      toast.warn("Payment or cancellation is already being processed.");
      return;
    }

    if (courses.length === 0) {
      toast.warn("No courses to checkout.");
      return;
    }

    setIsRazorpayProcessing(true);

    try {
      const courseIds = courses.map((c) => c._id);
      const response = await initiateCheckout(courseIds, totalAmount, "razorpay");
      const order = response?.order;

      if (!order || !order.gatewayOrderId) {
        toast.error("Failed to initiate order with Razorpay.");
        setIsRazorpayProcessing(false);
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
            setIsRazorpayProcessing(false);
            navigate("/user/enrolled");
          } catch (error: any) {
            handleBackendError(error, "razorpay");
            setIsRazorpayProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            console.log("Razorpay modal dismissed");
            markOrderAsFailed(order._id);
          },
          onhidden: function () {
            console.log("Razorpay modal hidden");
            setIsRazorpayProcessing(false);
          },
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      razorpayInstanceRef.current = rzp;

      rzp.on("payment.failed", function (response: any) {
        console.error("Razorpay payment failed:", response.error);
        markOrderAsFailed(order._id);
      });

      rzp.open();
    } catch (error: any) {
      handleBackendError(error, "razorpay");
      setIsRazorpayProcessing(false);
    }
  };

  const handleWalletPayment = async () => {
    if (isProcessing) {
      toast.warn("Payment or cancellation is already being processed.");
      return;
    }

    if (courses.length === 0) {
      toast.warn("No courses to checkout.");
      return;
    }

    if (!wallet || wallet.balance < totalAmount) {
      toast.error("Insufficient wallet balance. Please use Razorpay or recharge your wallet.");
      return;
    }

    setIsWalletProcessing(true);

    try {
      const courseIds = courses.map((c) => c._id);
      await initiateCheckout(courseIds, totalAmount, "wallet");

      toast.success("Payment successful via wallet! You've been enrolled.");
      setIsWalletProcessing(false);
      fetchWalletBalance();
      navigate("/user/enrolled");
    } catch (error: any) {
      handleBackendError(error, "wallet");
      setIsWalletProcessing(false);
      fetchWalletBalance();
    }
  };

  const handlePayment = debounce(() => {
    if (paymentMethod === "razorpay") {
      handleRazorpayPayment();
    } else {
      handleWalletPayment();
    }
  }, 1000);

  const handleRemove = async (courseId: string, courseName: string) => {
    if (isProcessing) {
      toast.warn("Cannot modify cart during payment or cancellation process.");
      return;
    }

    try {
      await removeFromCart(courseId);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      toast.info(`${courseName} removed from cart.`);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message;
      if (errorMessage?.includes("already enrolled")) {
        toast.info(`${courseName} is already enrolled, removing from cart.`);
        setCourses((prev) => prev.filter((c) => c._id !== courseId));
      } else {
        toast.error("Failed to remove course.");
      }
    }
  };

  const handleBackToCart = () => {
    navigate("/user/cart");
  };

  const canProceedWithWallet = wallet && wallet.balance >= totalAmount;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🧾 Checkout Summary</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading your cart...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-6">Browse our courses and add some to your cart to get started!</p>
          <button
            onClick={() => navigate("/user/courses")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <>
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <div className="text-blue-800">
                  <div className="font-medium">Processing</div>
                  <div className="text-sm">Please don't refresh or close this tab until the process is complete.</div>
                </div>
              </div>
            </div>
          )}

          {pendingOrderId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6" style={{ zIndex: 1000 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">⚠️</div>
                  <div className="text-yellow-800">
                    <div className="font-medium">Pending Order Detected</div>
                    <div className="text-sm">A payment is in progress for these courses. Cancel it to start a new payment or wait 15 minutes for it to expire.</div>
                  </div>
                </div>
                <button
                  onClick={handleCancelPendingOrder}
                  disabled={isCancelProcessing}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isCancelProcessing
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-yellow-600 hover:bg-yellow-700 text-white"
                  }`}
                >
                  {isCancelProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Pending Order"
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course._id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <img
                            src={course.thumbnailUrl}
                            alt={course.courseName}
                            className="w-20 h-14 object-cover rounded-lg shadow-sm"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {course.courseName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          ₹{course.price.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleRemove(course._id, course.courseName)}
                          disabled={isProcessing}
                          className={`text-sm px-3 py-1 rounded transition-colors ${
                            isProcessing
                              ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                              : "text-red-600 hover:bg-red-50 hover:text-red-700"
                          }`}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">
                      Total Amount:
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="text-xl font-bold text-gray-900">
                        ₹{totalAmount.toLocaleString()}
                      </div>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {wallet && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">💰</div>
                  <div>
                    <div className="font-medium text-blue-900">Wallet Balance</div>
                    <div className="text-sm text-blue-700">Available for instant payment</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-900">
                    ₹{wallet.balance.toLocaleString()}
                  </div>
                  {!canProceedWithWallet && (
                    <div className="text-xs text-red-600">Insufficient balance</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Payment Method</h3>
            <div className="space-y-3">
              <label
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === "razorpay" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                  disabled={isProcessing}
                  className="mr-3 text-blue-600"
                />
                <div className="flex items-center">
                  <div className="text-2xl mr-3">💳</div>
                  <div>
                    <div className="font-medium">Razorpay</div>
                    <div className="text-sm text-gray-600">Credit/Debit Card, UPI, Net Banking</div>
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === "wallet" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                } ${isProcessing || !canProceedWithWallet ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  value="wallet"
                  checked={paymentMethod === "wallet"}
                  onChange={() => setPaymentMethod("wallet")}
                  disabled={isProcessing || !canProceedWithWallet}
                  className="mr-3 text-blue-600"
                />
                <div className="flex items-center">
                  <div className="text-2xl mr-3">💰</div>
                  <div>
                    <div className="font-medium">Wallet Payment</div>
                    <div className="text-sm text-gray-600">
                      {canProceedWithWallet ? "Instant payment from your wallet" : "Insufficient wallet balance"}
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Payment</h3>
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={handleWalletPayment}
                disabled={
                  isProcessing ||
                  !canProceedWithWallet ||
                  paymentMethod !== "wallet" ||
                  !!pendingOrderId
                }
                className={`flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center ${
                  isProcessing ||
                  !canProceedWithWallet ||
                  paymentMethod !== "wallet" ||
                  !!pendingOrderId
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isWalletProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing Wallet Payment...
                  </>
                ) : (
                  `💰 Pay via Wallet (₹${totalAmount.toLocaleString()})`
                )}
              </button>

              <button
                onClick={handleRazorpayPayment}
                disabled={
                  isProcessing ||
                  paymentMethod !== "razorpay" ||
                  !!pendingOrderId
                }
                className={`flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center ${
                  isProcessing ||
                  paymentMethod !== "razorpay" ||
                  !!pendingOrderId
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isRazorpayProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing Razorpay Payment...
                  </>
                ) : (
                  `💳 Pay via Razorpay (₹${totalAmount.toLocaleString()})`
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleBackToCart}
              disabled={isProcessing}
              className={`font-medium transition-colors ${
                isProcessing
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              ← Back to Cart
            </button>

            <button
              onClick={handlePayment}
              disabled={
                isProcessing ||
                courses.length === 0 ||
                (paymentMethod === "wallet" && !canProceedWithWallet) ||
                !!pendingOrderId
              }
              className={`${
                isProcessing ||
                courses.length === 0 ||
                (paymentMethod === "wallet" && !canProceedWithWallet) ||
                !!pendingOrderId
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                `Pay ₹${totalAmount.toLocaleString()}`
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutPage;