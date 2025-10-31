import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  membershipInitiateCheckout,
  createRazorpayOrder,
  verifyMembershipPurchase,
  purchaseMembershipWithWallet,
  instructorGetWallet,
  cancelOrder,
  markOrderAsFailed,
} from "../../../api/action/InstructorActionApi";
import { toast } from "react-toastify";
import { CheckCircle } from "lucide-react";
import type {
  RazorpayResponse,
  RazorpayErrorResponse,
  RazorpayOptions,
  RazorpayInstance,
} from "../../../types/interfaces/ICommon";

interface OrderData {
  amount: number;
  currency: string;
  planName: string;
  durationInDays: number;
  description?: string;
  benefits?: string[];
}

interface PendingOrderError {
  message: string;
  orderId?: string;
}

const MembershipCheckoutPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [pendingOrderError, setPendingOrderError] = useState<PendingOrderError | null>(null);

  // Processing states
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  const [isCancelProcessing, setIsCancelProcessing] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  // Refs
  const razorpayInstanceRef = useRef<RazorpayInstance | null>(null);

  const isProcessing = isRazorpayProcessing || isWalletProcessing || isCancelProcessing;

  // Navigation helpers
  const navigateToSlots = () => {
    setHasNavigated(true);
    navigate("/instructor/slots");
  };

  const navigateToPurchaseHistory = () => {
    setHasNavigated(true);
    navigate("/instructor/purchaseHistory");
  };

  // Fetch checkout data
  useEffect(() => {
    if (!planId || hasNavigated) return;

    const fetchCheckoutData = async () => {
      try {
        const data = await membershipInitiateCheckout(planId);
        setOrderData(data);

        const walletData = await instructorGetWallet();
        setWalletBalance(walletData?.wallet?.balance ?? 0);
      } catch (error) {
        console.error("Checkout initiation error:", error);
        toast.error("Failed to load checkout or wallet data");
        setHasNavigated(true);
        navigate("/instructor/slots");
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();

    return () => {
      if (razorpayInstanceRef.current?.close) {
        try {
          razorpayInstanceRef.current.close();
        } catch {
          // Ignore close errors
        }
      }
    };
  }, [planId, hasNavigated, navigate]);

  // Razorpay Payment
  const handlePayment = async () => {
    if (isProcessing || !orderData || !planId) {
      toast.warn("An action is already being processed.");
      return;
    }

    setIsRazorpayProcessing(true);
    setPendingOrderError(null);

    try {
      const razorpayOrder = await createRazorpayOrder(planId);

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: "uLearn Membership",
        description: `Purchase - ${orderData.planName}`,
        order_id: razorpayOrder.razorpayOrderId,
        handler: async (response: RazorpayResponse) => {
          try {
            await verifyMembershipPurchase({
              razorpayOrderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId,
            });

            toast.success("Membership activated successfully!");
            setIsRazorpayProcessing(false);
            navigateToSlots();
          }
           catch (err: unknown) {
  let errorMessage = "Payment verification failed";

  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response &&
    err.response.data &&
    typeof err.response.data === "object" &&
    "message" in err.response.data &&
    typeof err.response.data.message === "string"
  ) {
    errorMessage = err.response.data.message;
  }

  try {
    await markOrderAsFailed(response.razorpay_order_id);
  } catch {
    console.error("Failed to mark order as failed");
  }

  if (
    errorMessage.includes("already have an active membership") ||
    errorMessage.includes("Order not found or already processed")
  ) {
    toast.error(errorMessage);
    navigateToSlots();
  } else {
    toast.error(errorMessage);
    navigateToPurchaseHistory();
  }

  setIsRazorpayProcessing(false);
}
        },
        modal: {
          ondismiss: () => {
            console.log("Razorpay modal dismissed by user");
            setIsRazorpayProcessing(false);
          },
          onhidden: () => {
            console.log("Razorpay modal hidden");
            setIsRazorpayProcessing(false);
          },
        },
        prefill: {
          name: "Instructor",
          email: "instructor@example.com",
        },
        theme: {
          color: "#1E40AF",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpayInstanceRef.current = razorpay;

      razorpay.on("payment.failed", async (response: RazorpayErrorResponse) => {
        console.error("Razorpay payment failed:", response.error);

        try {
          await markOrderAsFailed(razorpayOrder.razorpayOrderId);
        } catch {
          console.error("Failed to mark order as failed");
        }

        toast.error("Payment failed. Please try again.");
        setIsRazorpayProcessing(false);
        navigateToPurchaseHistory();
      });

      razorpay.open();
    } 
    catch (error: unknown) {
  let errorMessage = "Failed to initiate payment";

  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    errorMessage = error.response.data.message;
  }

  if (errorMessage.includes("A pending order already exists")) {
    const match = errorMessage.match(/Order ID: ([\w-]+)/);
    const orderId = match ? match[1] : undefined;
    setPendingOrderError({ message: errorMessage, orderId });
  } else {
    toast.error(errorMessage);
  }
  
  setIsRazorpayProcessing(false);
}
  };

  // Wallet Purchase
  const handleWalletPurchase = async () => {
    if (isProcessing || !orderData || !planId) {
      toast.warn("An action is already being processed.");
      return;
    }

    if (walletBalance < orderData.amount) {
      toast.error("Insufficient wallet balance. Please use Razorpay or recharge your wallet.");
      return;
    }

    setIsWalletProcessing(true);
    setPendingOrderError(null);

    try {
      await purchaseMembershipWithWallet(planId);
      toast.success("Membership activated using wallet!");
      setIsWalletProcessing(false);
      navigateToSlots();
    } 
    catch (error: unknown) {
  let errorMessage = "Wallet payment failed";

  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    errorMessage = error.response.data.message;
  }

  if (errorMessage.includes("A pending order already exists")) {
    const match = errorMessage.match(/Order ID: ([\w-]+)/);
    const orderId = match ? match[1] : undefined;
    setPendingOrderError({ message: errorMessage, orderId });
  } else if (errorMessage.includes("already have an active membership")) {
    toast.error(errorMessage);
    navigateToSlots();
  } else {
    toast.error(errorMessage);
  }

  setIsWalletProcessing(false);
}

  };

  // Cancel Pending Order
  const handleCancelPendingOrder = async () => {
    if (!pendingOrderError?.orderId || isProcessing) return;

    setIsCancelProcessing(true);

    try {
      await cancelOrder(pendingOrderError.orderId);
      toast.success("Pending order cancelled successfully!");
      setPendingOrderError(null);
    } 
    catch (error: unknown) {
  let errorMessage = "Failed to cancel pending order";

  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    errorMessage = error.response.data.message;
  }

  toast.error(errorMessage);
}
    finally {
      setIsCancelProcessing(false);
    }
  };

  const handleBackToDashboard = () => {
    navigateToSlots();
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white py-10 px-6 md:px-20">
        <div className="max-w-2xl mx-auto flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading checkout details...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (!orderData) {
    return (
      <div className="min-h-screen bg-white py-10 px-6 md:px-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">Failed</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Order</h2>
            <p className="text-red-500 mb-6">Unable to load membership plan details.</p>
            <button
              onClick={handleBackToDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="min-h-screen bg-white py-10 px-6 md:px-20">
      <div className="max-w-2xl mx-auto shadow-lg border rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Membership Checkout</h2>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <div className="text-blue-800">
                <div className="font-medium">Processing</div>
                <div className="text-sm">
                  Please don't refresh or close this tab until the action is complete.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Order Warning */}
        {pendingOrderError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3">Warning</div>
              <div className="text-yellow-800">
                <div className="font-medium">Pending Order Detected</div>
                <div className="text-sm">{pendingOrderError.message}</div>
                {pendingOrderError.orderId && (
                  <button
                    onClick={handleCancelPendingOrder}
                    disabled={isProcessing}
                    className={`mt-2 px-4 py-2 rounded-lg text-white ${
                      isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {isCancelProcessing ? (
                      <>
                        <div className="animate-spin inline-block h-4 w-4 border-b-2 border-white mr-2"></div>
                        Canceling...
                      </>
                    ) : (
                      "Cancel Pending Order"
                    )}
                  </button>
                )}
                <p className="text-sm mt-2">
                  {pendingOrderError.orderId
                    ? "Or wait 15 minutes to try again."
                    : "Please wait 15 minutes to try again."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="space-y-4 mb-6">
          <p><strong>Plan Name:</strong> {orderData.planName}</p>
          <p><strong>Duration:</strong> {orderData.durationInDays} days</p>
          <p><strong>Price:</strong> ₹{orderData.amount}</p>

          <p>
            <strong>Your Wallet Balance:</strong>{" "}
            <span className={walletBalance < orderData.amount ? "text-red-600" : "text-green-600"}>
              ₹{walletBalance}
            </span>
          </p>

          {orderData.description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{orderData.description}</p>
            </div>
          )}

          {orderData.benefits && orderData.benefits.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-3">Plan Benefits:</h3>
              <ul className="space-y-2">
                {orderData.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="text-green-500 w-4 h-4 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Payment Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            onClick={handleWalletPurchase}
            disabled={isProcessing || walletBalance < orderData.amount}
            className={`flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center ${
              isProcessing || walletBalance < orderData.amount
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isWalletProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : walletBalance < orderData.amount ? (
              "Insufficient Wallet Balance"
            ) : (
              `Pay with Wallet (₹${orderData.amount})`
            )}
          </button>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className={`flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center ${
              isProcessing ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isRazorpayProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              `Pay with Razorpay (₹${orderData.amount})`
            )}
          </button>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleBackToDashboard}
            disabled={isProcessing}
            className={`font-medium transition-colors ${
              isProcessing ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipCheckoutPage;