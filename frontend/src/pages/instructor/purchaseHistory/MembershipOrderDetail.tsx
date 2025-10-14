import { useEffect, useState, useRef } from "react"; // Add useRef
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
  membershipDetail,
  downloadReceiptForMembership,
  retryPayment,
  markOrderAsFailed,
  verifyMembershipPurchase, // Add verifyMembershipPurchase
} from "../../../api/action/InstructorActionApi";
import { Download, RefreshCw, AlertTriangle } from "lucide-react";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import type { IMembershipOrderDetail } from "../interface/instructorInterface";

const MembershipOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<IMembershipOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // Add missing state
  const navigate = useNavigate();
  const razorpayInstanceRef = useRef<any>(null); // Add ref for Razorpay instance

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) return;
        const data = await membershipDetail(orderId);
        console.log("data", data);
        setOrder(data);
      } catch (err) {
        toast.error("Failed to load membership order.");
        navigate("/instructor/purchaseHistory");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    // Cleanup Razorpay modal on component unmount
    return () => {
      if (razorpayInstanceRef.current) {
        try {
          razorpayInstanceRef.current.close();
        } catch (e) {
          console.error("Error closing Razorpay modal:", e);
        }
      }
    };
  }, [orderId, navigate]);

  const handleRetryPayment = async () => {
    if (!orderId || !order) return;

    setActionLoading("retry");
    try {
      const result = await retryPayment(orderId);
      toast.success("Payment retry initiated successfully!");

      // Initiate Razorpay payment
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: result.amount * 100, // Convert to paise
        currency: result.currency,
        name: "uLearn Membership",
        description: `Retry Payment - ${order.membershipPlan.name}`,
        order_id: result.razorpayOrderId,
        handler: async function (response: any) {
          try {
            await verifyMembershipPurchase({
              razorpayOrderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId: result.planId,
            });

            toast.success("✅ Membership activated successfully!");
            setActionLoading(null);
            navigate("/instructor/slots");
          } catch (err: any) {
            console.error("Payment verification failed:", err);
            console.log("Response keys:", Object.keys(response));

            try {
              await markOrderAsFailed(result.razorpayOrderId);
              console.log("Order marked as failed for razorpay order ID:", result.razorpayOrderId);
            } catch (markFailedError) {
              console.error("Failed to mark order as failed:", markFailedError);
            }

            const errorMessage =
              err?.response?.data?.message || "❌ Payment verification failed";
            toast.error(errorMessage);
            setActionLoading(null);
            navigate("/instructor/purchaseHistory");
          }
        },
        modal: {
          ondismiss: function () {
            console.log("Razorpay modal dismissed by user");
            setActionLoading(null);
          },
          onhidden: function () {
            console.log("Razorpay modal hidden");
            setActionLoading(null);
          },
        },
        prefill: {
          name: order.instructor.name,
          email: order.instructor.email,
        },
        theme: {
          color: "#1E40AF",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpayInstanceRef.current = razorpay;

      razorpay.on("payment.failed", async function (response: any) {
        console.error("Razorpay payment failed:", response.error);
        console.log("Failed payment response:", response);

        try {
          await markOrderAsFailed(result.razorpayOrderId);
          console.log("Order marked as failed for razorpay order ID:", result.razorpayOrderId);
        } catch (markFailedError) {
          console.error("Failed to mark order as failed:", markFailedError);
        }

        toast.error("Payment failed. Please try again.");
        setActionLoading(null);
        navigate("/instructor/purchaseHistory");
      });

      razorpay.open();
    } catch (err: any) {
      console.error("Retry payment error:", err);
      toast.error(err.response?.data?.message || "Failed to retry payment");
      setActionLoading(null);
    }
  };

  // Move confirmMarkAsFailed function outside to make it accessible
  const confirmMarkAsFailed = async () => {
    if (!order?.razorpayOrderId) return;
    
    setActionLoading("failed");
    setShowConfirmModal(false); // Close modal
    try {
      await markOrderAsFailed(order.razorpayOrderId);
      toast.success("Order marked as failed successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("Mark as failed error:", err);
      toast.error(err.response?.data?.message || "Failed to mark order as failed");
      setActionLoading(null);
    }
  };

  const handleMarkAsFailed = async () => {
    if (!order?.razorpayOrderId) return;
    
    // Show confirmation modal instead of toast
    setShowConfirmModal(true);
  };

  const handleDownload = async () => {
    if (!order?.razorpayOrderId) return;

    setActionLoading("download");
    try {
      await downloadReceiptForMembership(order.razorpayOrderId);
      toast.success("Receipt downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download receipt.");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-sm">
          <p className="text-base sm:text-lg text-gray-600 mb-4">Order not found.</p>
          <button
            onClick={() => navigate("/instructor/purchaseHistory")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Back to Purchase History
          </button>
        </div>
      </div>
    );
  }

  const plan = order.membershipPlan;
  const instructor = order.instructor;
  const isWalletPayment = order.razorpayOrderId ? order.razorpayOrderId.startsWith("wallet_") : false;
  const isPending = order.paymentStatus === "pending";
  const isFailed = order.paymentStatus === "failed";
  const isPaid = order.paymentStatus === "paid";

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Membership Order Details
            </h2>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Order placed on{" "}
              {format(new Date(order.createdAt), "MMMM d, yyyy 'at' hh:mm a")}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {isPaid && (
              <button
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm sm:text-base disabled:opacity-50"
                onClick={handleDownload}
                disabled={actionLoading === "download"}
              >
                <Download size={16} className="sm:h-5 sm:w-5" />
                {actionLoading === "download" ? "Downloading..." : "Download Receipt"}
              </button>
            )}

            {isFailed && !isWalletPayment && (
              <button
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm sm:text-base disabled:opacity-50"
                onClick={handleRetryPayment}
                disabled={actionLoading === "retry"}
              >
                <RefreshCw size={16} className="sm:h-5 sm:w-5" />
                {actionLoading === "retry" ? "Retrying..." : "Retry Payment"}
              </button>
            )}

            {isPending && !isWalletPayment && (
              <button
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm text-sm sm:text-base disabled:opacity-50"
                onClick={handleMarkAsFailed}
                disabled={actionLoading === "failed"}
              >
                <AlertTriangle size={16} className="sm:h-5 sm:w-5" />
                {actionLoading === "failed" ? "Marking..." : "Mark as Failed"}
              </button>
            )}
          </div>
        </div>

        {/* Status Alert */}
        {isPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Payment Pending</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This order is waiting for payment completion. You can mark it as failed if the payment process was interrupted.
                </p>
              </div>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Payment Failed</h3>
                <p className="text-sm text-red-700 mt-1">
                  This payment was unsuccessful. {!isWalletPayment && "You can retry the payment with a new transaction."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Customer</p>
            <p className="font-semibold text-sm sm:text-base text-gray-900">{instructor.name}</p>
            <p className="text-sm text-gray-600">{instructor.email}</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Payment</p>
            <p className="font-semibold text-sm sm:text-base">
              {isWalletPayment ? "Wallet" : "Razorpay"}
            </p>
            <p className="font-semibold text-lg sm:text-xl text-green-600">₹{order.price}</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p
              className={`inline-block font-semibold text-sm px-2 sm:px-3 py-1 rounded-full ${getStatusColor(order.paymentStatus)}`}
            >
              {order.paymentStatus.toUpperCase()}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Order ID: {order.razorpayOrderId}</p>
          </div>
        </div>

        {/* Membership Plan Details */}
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200">
          <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
            Membership Plan
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Plan Name</p>
              <p className="font-semibold text-sm sm:text-base text-gray-900">{plan.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Duration</p>
              <p className="font-semibold text-sm sm:text-base text-gray-900">
                {plan.durationInDays} days
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Start Date</p>
              <p className="font-semibold text-sm sm:text-base text-gray-900">
                {order.startDate ? format(new Date(order.startDate), "dd MMM yyyy") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">End Date</p>
              <p className="font-semibold text-sm sm:text-base text-gray-900">
                {order.endDate ? format(new Date(order.endDate), "dd MMM yyyy") : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Plan Description */}
        {plan.description && (
          <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p className="text-sm sm:text-base text-gray-800">{plan.description}</p>
          </div>
        )}

        {/* Plan Benefits */}
        {Array.isArray(plan.benefits) && plan.benefits.length > 0 && (
          <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-2 sm:mb-3">Benefits</p>
            <ul className="list-none space-y-2">
              {plan.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm sm:text-base text-gray-800">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Order Timeline/History */}
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200">
          <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
            Order Timeline
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Order Created</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(order.createdAt), "MMM d, yyyy 'at' hh:mm a")}
                </p>
              </div>
            </div>

            {order.startDate && isPaid && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Payment Successful</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(order.startDate), "MMM d, yyyy 'at' hh:mm a")}
                  </p>
                </div>
              </div>
            )}

            {order.endDate && isPaid && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Membership Expires</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(order.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center sm:justify-start">
          <button
            onClick={() => navigate("/instructor/purchaseHistory")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            Back to Purchase History
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="MARK ORDER AS FAILED"
        message={
          <div>
            <p className="font-medium mb-2">Are you sure you want to mark this order as failed?</p>
            <p>This action cannot be undone and will permanently change the order status.</p>
          </div>
        }
        confirmText="Yes, Mark as Failed"
        cancelText="Cancel"
        onConfirm={confirmMarkAsFailed}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};

export default MembershipOrderDetail;