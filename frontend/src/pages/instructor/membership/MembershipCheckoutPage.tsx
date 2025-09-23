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

const MembershipCheckoutPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  // Main state
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [orderData, setOrderData] = useState<{
    amount: number;
    currency: string;
    planName: string;
    durationInDays: number;
    description?: string;
    benefits?: string[];
  } | null>(null);
  const [pendingOrderError, setPendingOrderError] = useState<{
    message: string;
    orderId?: string;
  } | null>(null);

  // Processing states
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  const [isCancelProcessing, setIsCancelProcessing] = useState(false);
  
  // Navigation control - prevent re-fetching after navigation
  const [hasNavigated, setHasNavigated] = useState(false);

  // Session management
  const razorpayInstanceRef = useRef<any>(null);

  // Computed state for any processing
  const isProcessing = isRazorpayProcessing || isWalletProcessing || isCancelProcessing;

  useEffect(() => {
    // Prevent re-fetching if we've already navigated away
    if (!planId || hasNavigated) return;

    const fetchCheckoutData = async () => {
      try {
        const data = await membershipInitiateCheckout(planId);
        setOrderData(data);

        console.log('initiate', data);

        const walletData = await instructorGetWallet();
        if (walletData?.wallet?.balance != null) {
          setWalletBalance(walletData.wallet.balance);
        } else {
          setWalletBalance(0);
        }
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
      // Close any open Razorpay modal
      if (razorpayInstanceRef.current) {
        try {
          razorpayInstanceRef.current.close();
        } catch (e) {
          // Ignore errors when closing
        }
      }
    };
  }, [planId]); // Remove navigate and hasNavigated from dependencies

  const navigateToSlots = () => {
    setHasNavigated(true);
    navigate("/instructor/slots");
  };

  const navigateToPurchaseHistory = () => {
    setHasNavigated(true);
    navigate("/instructor/purchaseHistory");
  };

  const handlePayment = async () => {
    if (isProcessing) {
      toast.warn("An action is already being processed.");
      return;
    }

    if (!orderData || !planId) return toast.error("Order data not ready");

    setIsRazorpayProcessing(true);
    setPendingOrderError(null);

    try {
      const razorpayOrder = await createRazorpayOrder(planId);
      
      // Store the orderId from backend response for later use
      console.log('Razorpay order created:', razorpayOrder);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: "uLearn Membership",
        description: `Purchase - ${orderData.planName}`,
        order_id: razorpayOrder.razorpayOrderId,
        handler: async function (response: any) {
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
          } catch (err: any) {
            console.error("Payment verification failed:", err);
            
            // Console the entire response to debug
            console.log('full response', response);
            console.log("Response keys", Object.keys(response));
            
            const errorMessage =
              err?.response?.data?.message || "Payment verification failed";

            // Mark order as failed - we need to use the razorpayOrderId
            try {
              await markOrderAsFailed(response.razorpay_order_id);
              console.log("Order marked as failed for razorpay order ID:", response.razorpay_order_id);
            } catch (markFailedError) {
              console.error("Failed to mark order as failed:", markFailedError);
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
          ondismiss: function () {
            console.log("Razorpay modal dismissed by user");
            setIsRazorpayProcessing(false);
          },
          onhidden: function () {
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

      razorpay.on("payment.failed", async function (response: any) {
        console.error("Razorpay payment failed:", response.error);
        console.log("Failed payment response:", response);
        
        // Mark order as failed when payment fails
        try {
          // Use razorpayOrderId to find the order and mark as failed
          await markOrderAsFailed(razorpayOrder.razorpayOrderId);
          console.log("Order marked as failed for razorpay order ID:", razorpayOrder.razorpayOrderId);
        } catch (markFailedError) {
          console.error("Failed to mark order as failed:", markFailedError);
        }

        toast.error("Payment failed. Please try again.");
        setIsRazorpayProcessing(false);
        navigateToPurchaseHistory();
      });

      razorpay.open();
    } catch (error: any) {
      console.error("Razorpay order creation error:", error);
      const errorMessage = error?.response?.data?.message || "Failed to initiate payment";
      console.log("Error message:", errorMessage);
      
      if (errorMessage.includes("A pending order already exists")) {
        // Fixed regex to capture full orderId including hyphens
        const match = errorMessage.match(/Order ID: ([\w-]+)/);
        const orderId = match ? match[1] : undefined;
        console.log("Extracted orderId:", orderId);
        setPendingOrderError({
          message: errorMessage,
          orderId,
        });
      } else {
        toast.error(errorMessage);
      }
      setIsRazorpayProcessing(false);
    }
  };

  const handleWalletPurchase = async () => {
    if (isProcessing) {
      toast.warn("An action is already being processed.");
      return;
    }

    if (!orderData || !planId) return toast.error("Order data not ready");

    if (walletBalance !== null && walletBalance < orderData.amount) {
      toast.error(
        "Insufficient wallet balance. Please use Razorpay or recharge your wallet."
      );
      return;
    }

    setIsWalletProcessing(true);
    setPendingOrderError(null);

    try {
      await purchaseMembershipWithWallet(planId);
      toast.success("Membership activated using wallet!");
      setIsWalletProcessing(false);
      navigateToSlots();
    } catch (error: any) {
      console.error("Wallet payment failed:", error);
      const errorMessage =
        error?.response?.data?.message || "Wallet payment failed";
      console.log("Error message:", errorMessage);
      
      if (errorMessage.includes("A pending order already exists")) {
        // Fixed regex to capture full orderId including hyphens
        const match = errorMessage.match(/Order ID: ([\w-]+)/);
        const orderId = match ? match[1] : undefined;
        console.log("Extracted orderId:", orderId);
        setPendingOrderError({
          message: errorMessage,
          orderId,
        });
      } else if (errorMessage.includes("already have an active membership")) {
        toast.error(errorMessage);
        navigateToSlots();
      } else if (errorMessage.includes("Insufficient wallet balance")) {
        toast.error("Insufficient wallet balance.");
      } else {
        toast.error(errorMessage);
      }
      setIsWalletProcessing(false);
    }
  };

  const handleCancelPendingOrder = async () => {
    if (!pendingOrderError?.orderId) {
      toast.error("No pending order ID available to cancel.");
      return;
    }

    if (isProcessing) {
      toast.warn("An action is already being processed.");
      return;
    }

    setIsCancelProcessing(true);

    console.log('pendingOrder orderId:', pendingOrderError.orderId);

    try {
      await cancelOrder(pendingOrderError.orderId);
      toast.success("Pending order cancelled successfully!");
      setPendingOrderError(null);
    } catch (error: any) {
      console.error("Cancel order failed:", error);
      toast.error(error.message || "Failed to cancel pending order");
    } finally {
      setIsCancelProcessing(false);
    }
  };

  const handleBackToDashboard = () => {
    navigateToSlots();
  };

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

  if (!orderData) {
    return (
      <div className="min-h-screen bg-white py-10 px-6 md:px-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Failed to Load Order
            </h2>
            <p className="text-red-500 mb-6">
              Unable to load membership plan details.
            </p>
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

  return (
    <div className="min-h-screen bg-white py-10 px-6 md:px-20">
      <div className="max-w-2xl mx-auto shadow-lg border rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Membership Checkout
        </h2>

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

        {pendingOrderError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3">⚠️</div>
              <div className="text-yellow-800">
                <div className="font-medium">Pending Order Detected</div>
                <div className="text-sm">{pendingOrderError.message}</div>
                {pendingOrderError.orderId && (
                  <button
                    onClick={handleCancelPendingOrder}
                    disabled={isProcessing}
                    className={`mt-2 px-4 py-2 rounded-lg text-white ${
                      isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
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

        <div className="space-y-4 mb-6">
          <p>
            <strong>Plan Name:</strong> {orderData.planName}
          </p>
          <p>
            <strong>Duration:</strong> {orderData.durationInDays} days
          </p>
          <p>
            <strong>Price:</strong> ₹{orderData.amount}
          </p>

          {walletBalance !== null && (
            <p>
              <strong>Your Wallet Balance:</strong>{" "}
              <span
                className={
                  walletBalance < orderData.amount
                    ? "text-red-600"
                    : "text-green-600"
                }
              >
                ₹{walletBalance}
              </span>
            </p>
          )}

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
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <CheckCircle className="text-green-500 w-4 h-4 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            onClick={handleWalletPurchase}
            disabled={
              isProcessing ||
              (walletBalance !== null && walletBalance < orderData.amount)
            }
            className={`flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center ${
              isProcessing ||
              (walletBalance !== null && walletBalance < orderData.amount)
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isWalletProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : walletBalance !== null && walletBalance < orderData.amount ? (
              "💰 Insufficient Wallet Balance"
            ) : (
              `💰 Pay with Wallet (₹${orderData.amount})`
            )}
          </button>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className={`flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center ${
              isProcessing
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isRazorpayProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              `💳 Pay with Razorpay (₹${orderData.amount})`
            )}
          </button>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleBackToDashboard}
            disabled={isProcessing}
            className={`font-medium transition-colors ${
              isProcessing
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-800"
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