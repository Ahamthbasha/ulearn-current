import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  orderDetail,
  downloadInvoice,
  retryPayment,
  MarkCourseOrderAsFailed as markOrderAsFailed,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import type { Order } from "../interface/studentInterface";

export default function StudentOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isMarkingFailed, setIsMarkingFailed] = useState(false);
  const [paymentDismissed, setPaymentDismissed] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderDetail(orderId!);
        setOrder(res.order);
        if (res.order && !res.order.retryInProgress) {
          setPaymentDismissed(false);
        }
      } catch (error) {
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  const handleDownloadInvoice = async () => {
    try {
      await downloadInvoice(orderId!);
    } catch (error) {
      toast.error("Failed to download invoice");
    }
  };

  const handleRetryPayment = async () => {
    try {
      setIsRetrying(true);
      setPaymentDismissed(false);

      const res = await retryPayment(orderId!);

      if (res.success && res.paymentData) {
        const { amount, currency, razorpayOrderId, key } = res.paymentData;
        const retryAttemptId = Date.now().toString();

        if (!razorpayOrderId || !amount) {
          toast.error("Invalid payment configuration received from server");
          return;
        }

        const razorpayKey = key || import.meta.env.VITE_RAZORPAY_KEY_ID;

        if (!razorpayKey) {
          toast.error("Payment service not configured properly");
          return;
        }

        console.log("Initializing Razorpay with:", {
          key: razorpayKey,
          razorpayOrderId,
          amount,
          amountInPaise: amount * 100,
          retryAttemptId,
        });

        if (!(window as any).Razorpay) {
          toast.error("Payment service not available. Please refresh the page and try again.");
          return;
        }

        const options = {
          key: razorpayKey,
          amount: Math.round(amount * 100),
          currency: currency || "INR",
          order_id: razorpayOrderId,
          name: "uLearn",
          description: `Retry Payment for Order ${orderId}`,
          handler: async (response: any) => {
            try {
              console.log("Payment successful, verifying with backend:", response);
              const verifyRes = await retryPayment(orderId!, {
                paymentId: response.razorpay_payment_id,
                method: "razorpay",
                amount,
                retryAttemptId,
              });

              if (verifyRes.success) {
                toast.success("Payment successful! Order updated.");
                const updatedOrder = await orderDetail(orderId!);
                setOrder(updatedOrder.order);
                setPaymentDismissed(false);
              } else {
                toast.error(`Payment verification failed: ${verifyRes.message}`);
                setPaymentDismissed(false);
              }
            } catch (error: any) {
              console.error("Payment verification error:", error);
              toast.error(error.response?.data?.message || "Failed to verify payment");
              setPaymentDismissed(false);
            }
          },
          modal: {
            ondismiss: () => {
              console.log("Payment modal dismissed by user");
              setPaymentDismissed(true);
              toast.warn(
                "Payment was not completed",
                { autoClose: false, closeOnClick: false, pauseOnHover: true }
              );
            },
            escape: true,
            backdrop_close: false,
          },
          prefill: { name: order?.userInfo.username || "", email: order?.userInfo.email || "" },
          theme: { color: "#2563eb" },
          retry: { enabled: true, max_count: 3 },
        };

        try {
          const razorpay = new (window as any).Razorpay(options);
          razorpay.on("payment.failed", async (response: any) => {
            console.error("Payment failed:", response.error);
            toast.error(`Payment failed: ${response.error.description || "Unknown error"}`);
            try {
              const failRes = await markOrderAsFailed(orderId!);
              if (failRes.success) {
                toast.success("Order marked as failed successfully");
                const updatedOrder = await orderDetail(orderId!);
                setOrder(updatedOrder.order);
              } else {
                toast.error(failRes.message || "Failed to mark order as failed");
              }
            } catch (error: any) {
              console.error("Error marking order as failed:", error);
              toast.error(error.response?.data?.message || "Failed to mark order as failed");
            }
            setPaymentDismissed(false);
          });
          razorpay.open();
        } catch (razorpayError) {
          console.error("Failed to initialize Razorpay:", razorpayError);
          toast.error("Failed to open payment interface");
          setPaymentDismissed(false);
        }
      } else {
        toast.error(res.message || "Failed to initiate payment retry");
      }
    } catch (error: any) {
      console.error("Retry payment error:", error);
      toast.error(error.response?.data?.message || "Failed to initiate payment retry");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleMarkOrderAsFailed = async () => {
    try {
      setIsMarkingFailed(true);
      const res = await markOrderAsFailed(orderId!);
      if (res.success) {
        toast.success("Order marked as failed successfully");
        const updatedOrder = await orderDetail(orderId!);
        setOrder(updatedOrder.order);
      } else {
        toast.error(res.message || "Failed to mark order as failed");
      }
    } catch (error: any) {
      console.error("Mark order as failed error:", error);
      toast.error(error.response?.data?.message || "Failed to mark order as failed");
    } finally {
      setIsMarkingFailed(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!order) return <div className="text-center py-20 text-red-500">Order not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg mb-6 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Order Details</h1>
              <p className="text-gray-600 text-sm sm:text-base">Order ID: {order.orderId}</p>
              <p className="text-gray-600 text-sm sm:text-base">Order Date: {order.orderDate}</p>
              <p className="text-gray-600 text-sm sm:text-base">Customer: {order.userInfo.username} ({order.userInfo.email})</p>
              <p className="text-sm sm:text-base">
                Status: <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>{order.status}</span>
              </p>
            </div>
            <div className="flex gap-4">
              {order.status === "SUCCESS" && (
                <button
                  onClick={handleDownloadInvoice}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m0 0l-3-3m3 3l3-3m6 3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Download Invoice
                </button>
              )}
              {order.status === "FAILED" && (
                <button
                  onClick={handleRetryPayment}
                  disabled={isRetrying}
                  className={`${
                    isRetrying ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-600 hover:bg-yellow-700"
                  } text-white px-4 py-2 rounded-lg font-medium transition duration-200 flex items-center gap-2`}
                >
                  {isRetrying ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9H3m0 6h1.582A8.001 8.001 0 0120.418 13H20m-16 0v5"
                      />
                    </svg>
                  )}
                  {isRetrying ? "Processing..." : "Retry Payment"}
                </button>
              )}
              {order.status === "PENDING" && (
                <button
                  onClick={handleMarkOrderAsFailed}
                  disabled={isMarkingFailed}
                  className={`${
                    isMarkingFailed ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                  } text-white px-4 py-2 rounded-lg font-medium transition duration-200 flex items-center gap-2`}
                >
                  {isMarkingFailed ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {isMarkingFailed ? "Processing..." : "Mark as Failed"}
                </button>
              )}
            </div>
          </div>
          {paymentDismissed && order.status === "PENDING" && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Payment Not Completed</span>
              </div>
              <p className="text-sm mt-1">
                You must complete the payment as success or failure, or wait 15 minutes to retry.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Purchased Courses</h3>
          </div>
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Course</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">Original Price</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">Offer (%)</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">Offer Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.coursesInfo.map((course, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6 flex items-center gap-4">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.courseName}
                        className="w-16 h-16 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.png"; // Fallback image
                        }}
                      />
                      <div>
                        <h4 className="font-medium text-gray-800">{course.courseName}</h4>
                        <p className="text-sm text-gray-600">Digital Course</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-gray-800">
                      ₹{course.courseOriginalPrice.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-gray-800">
                      {course.courseOfferDiscount ? `${course.courseOfferDiscount}%` : "0%"}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-gray-800">
                      ₹{course.courseOfferPrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-gray-200">
            {order.coursesInfo.map((course, idx) => (
              <div key={idx} className="p-4 flex gap-4 items-center">
                <img
                  src={course.thumbnailUrl}
                  alt={course.courseName}
                  className="w-16 h-16 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.png"; // Fallback image
                  }}
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{course.courseName}</h4>
                  <p className="text-sm text-gray-600">Digital Course</p>
                  <p className="text-sm text-gray-600">Original Price: ₹{course.courseOriginalPrice.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Offer: {course.courseOfferDiscount ? `${course.courseOfferDiscount}%` : "0%"}</p>
                  <p className="text-lg font-semibold text-gray-800">₹{course.courseOfferPrice.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Total Course Price:</span>
                <span className="text-lg font-semibold text-gray-800">₹{order.sumOfAllCourseOriginalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Final Price (Including Offers):</span>
                <span className="text-lg font-semibold text-gray-800">₹{order.sumOfAllCourseIncludingOfferPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {order.couponInfo && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Coupon Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Coupon Code:</span>
                <span className="text-gray-800 font-semibold">{order.couponInfo.couponCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Discount Percentage:</span>
                <span className="text-gray-800 font-semibold">{order.couponInfo.couponDiscountPercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Discount Amount:</span>
                <span className="text-gray-800 font-semibold">₹{order.couponInfo.discountAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-700">Final Price:</span>
            <span className="text-2xl font-bold text-gray-800">₹{order.finalPrice.toLocaleString()}</span>
          </div>
        </div>

        {order.status === "FAILED" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-800 font-medium">Payment Failed</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Your payment was unsuccessful. You can retry the payment using the button above.
            </p>
          </div>
        )}

        {order.status === "PENDING" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-yellow-800 font-medium">Payment Pending</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Your payment is being processed. Please wait for confirmation or mark as failed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}