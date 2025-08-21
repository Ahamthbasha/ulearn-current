import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  slotCheckout,
  verifySlotPayment,
  getWallet,
  bookSlotViaWallet,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { format } from "date-fns";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const SlotCheckoutPage = () => {
  const { slotId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const [showRetryOption, setShowRetryOption] = useState(false);
  const [lockPaymentType, setLockPaymentType] = useState<string>("");
  const lockRef = useRef(false);
  const sessionId = useRef(`slot_session_${Date.now()}_${Math.random()}`);
  const razorpayOpenRef = useRef(false);
  const razorpayInstanceRef = useRef<any>(null);

  // Computed state for any processing
  const isProcessing = isRazorpayProcessing || isWalletProcessing;

  useEffect(() => {
    if (!slotId) return;

    const init = async () => {
      try {
        initializeSessionLock();
        
        const walletRes = await getWallet();
        setWalletBalance(walletRes.wallet?.balance || 0);

        const res = await slotCheckout(slotId);
        const { booking, razorpayOrder } = res;

        if (!booking || !razorpayOrder) {
          console.warn("Missing booking or razorpayOrder", {
            booking,
            razorpayOrder,
          });
          toast.error("Failed to load booking details.");
          navigate("/user/slotsHistory");
          return;
        }

        setBooking(booking);
        setOrder(razorpayOrder);
      } catch (err: any) {
        console.error(
          "❌ Checkout initiation error:",
          err.response?.data || err.message
        );
        toast.error(
          err.response?.data?.message || "Failed to initiate booking"
        );
        navigate("/user/slotsHistory");
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      // Close any open Razorpay modal
      if (razorpayInstanceRef.current) {
        try {
          razorpayInstanceRef.current.close();
        } catch (e) {
          // Ignore errors when closing
        }
      }

      // Only cleanup if this session owns the lock
      const lockData = localStorage.getItem('slot_payment_processing');
      if (lockData && lockData !== 'false') {
        try {
          const { sessionId: lockedSession } = JSON.parse(lockData);
          if (lockedSession === sessionId.current) {
            releasePaymentLock();
          }
        } catch {
          // If parsing fails, don't release the lock as it might belong to another session
        }
      } else {
        // No active lock, safe to cleanup local state
        lockRef.current = false;
        setIsRazorpayProcessing(false);
        setIsWalletProcessing(false);
      }
    };
  }, [slotId]);

  const initializeSessionLock = () => {
    // Check if payment is already in progress
    const checkPaymentLock = () => {
      const lockData = localStorage.getItem('slot_payment_processing');
      if (lockData && lockData !== 'false') {
        try {
          const { isLocked, sessionId: lockedSession, timestamp, paymentType } = JSON.parse(lockData);
          const now = Date.now();
          
          // Auto-unlock after 5 minutes (payment timeout)
          if (now - timestamp > 5 * 60 * 1000) {
            localStorage.setItem('slot_payment_processing', 'false');
            setSessionLocked(false);
            setShowRetryOption(false);
            setLockPaymentType("");
            return;
          }

          if (isLocked && lockedSession !== sessionId.current) {
            setSessionLocked(true);
            setLockPaymentType(paymentType || "");
            
            // Only show retry option for Razorpay payments after 30 seconds (longer delay)
            // This gives more time for the original payment to complete
            if (paymentType === 'razorpay' && now - timestamp > 30 * 1000) {
              setLockMessage("Slot payment is being processed in another tab. If the payment window was closed or is not responding, you can retry below.");
              setShowRetryOption(true);
            } else {
              const timeRemaining = Math.ceil((30 * 1000 - (now - timestamp)) / 1000);
              if (paymentType === 'razorpay' && timeRemaining > 0) {
                setLockMessage(`Slot payment is being processed in another tab. Retry option will be available in ${timeRemaining} seconds.`);
              } else {
                setLockMessage("Slot payment is being processed in another tab. Please wait or check your other tabs.");
              }
              setShowRetryOption(false);
            }
          } else {
            setSessionLocked(false);
            setShowRetryOption(false);
            setLockPaymentType("");
          }
        } catch {
          localStorage.setItem('slot_payment_processing', 'false');
          setSessionLocked(false);
          setShowRetryOption(false);
          setLockPaymentType("");
        }
      } else {
        setSessionLocked(false);
        setShowRetryOption(false);
        setLockPaymentType("");
      }
    };

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'slot_payment_processing') {
        checkPaymentLock();
      }
    };

    // Listen for visibility changes to detect tab switching
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, check lock status
        checkPaymentLock();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    checkPaymentLock();

    // Check periodically for retry option (every 3 seconds)
    const retryCheckInterval = setInterval(checkPaymentLock, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(retryCheckInterval);
    };
  };

  const acquirePaymentLock = (paymentType: string): boolean => {
    const lockData = localStorage.getItem('slot_payment_processing');
    
    if (lockData && lockData !== 'false') {
      try {
        const { isLocked, sessionId: lockedSession, timestamp } = JSON.parse(lockData);
        const now = Date.now();
        
        // If locked by another session and not expired
        if (isLocked && lockedSession !== sessionId.current && now - timestamp < 5 * 60 * 1000) {
          return false;
        }
      } catch {
        // Invalid lock data, proceed
      }
    }

    // Acquire lock
    localStorage.setItem('slot_payment_processing', JSON.stringify({
      isLocked: true,
      sessionId: sessionId.current,
      timestamp: Date.now(),
      paymentType: paymentType
    }));
    
    return true;
  };

  const releasePaymentLock = () => {
    // Only release if this session owns the lock
    const lockData = localStorage.getItem('slot_payment_processing');
    if (lockData && lockData !== 'false') {
      try {
        const { sessionId: lockedSession } = JSON.parse(lockData);
        if (lockedSession === sessionId.current) {
          localStorage.setItem('slot_payment_processing', 'false');
        }
      } catch {
        // If parsing fails, clear it anyway
        localStorage.setItem('slot_payment_processing', 'false');
      }
    }
    lockRef.current = false;
    razorpayOpenRef.current = false;
    setIsRazorpayProcessing(false);
    setIsWalletProcessing(false);
    setShowRetryOption(false);
    setLockPaymentType("");
  };

  const handleRazorpayPayment = () => {
    if (isProcessing || sessionLocked || lockRef.current) {
      toast.warn("Payment is already being processed.");
      return;
    }

    if (!order || !booking) return toast.error("Booking not ready");

    // Try to acquire payment lock
    if (!acquirePaymentLock('razorpay')) {
      setSessionLocked(true);
      setLockMessage("Slot payment is being processed in another tab. Please wait.");
      toast.warn("Payment is being processed in another tab.");
      return;
    }

    lockRef.current = true;
    razorpayOpenRef.current = false;
    setIsRazorpayProcessing(true);

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
      amount: order.amount,
      currency: order.currency,
      name: "uLearn Slot Booking",
      description: "Session with Instructor",
      order_id: order.id,
      handler: async function (response: any) {
        try {
          await verifySlotPayment(slotId!, response.razorpay_payment_id);
          toast.success("✅ Slot booked successfully!");
          releasePaymentLock();
          navigate("/user/slotsHistory");
        } catch (err: any) {
          console.error("Payment verification failed:", err);
          const errorMessage = err?.response?.data?.message || "❌ Payment verification failed";
          
          if (errorMessage.includes("already booked") || 
              errorMessage.includes("Slot already processed")) {
            toast.error(errorMessage);
            navigate("/user/slotsHistory");
          } else if (errorMessage.includes("Slot booking failed earlier")) {
            toast.error("This slot booking failed previously. Please try booking a new slot.");
            navigate("/user/slotsHistory");
          } else {
            toast.error(errorMessage);
          }
          
          releasePaymentLock();
        }
      },
      modal: {
        ondismiss: function () {
          console.log("Razorpay modal dismissed");
          releasePaymentLock();
        },
        onhidden: function () {
          console.log("Razorpay modal hidden");
          releasePaymentLock();
        },
      },
      prefill: {
        name: "",
        email: "",
      },
      theme: {
        color: "#1A73E8",
      },
    };

    const rzp = new window.Razorpay(options);
    razorpayInstanceRef.current = rzp;
    razorpayOpenRef.current = true;
    
    // Handle payment failures
    rzp.on('payment.failed', function (response: any) {
      console.error("Razorpay payment failed:", response.error);
      toast.error("Payment failed. Please try again.");
      releasePaymentLock();
    });

    rzp.open();
  };

  const handleWalletPayment = async () => {
    if (isProcessing || sessionLocked || lockRef.current) {
      toast.warn("Payment is already being processed.");
      return;
    }

    const slotPrice = booking?.slotId?.price || 0;

    if (walletBalance < slotPrice) {
      toast.error(
        "❌ Insufficient wallet balance. Please use Razorpay or recharge your wallet."
      );
      return;
    }

    // Try to acquire payment lock
    if (!acquirePaymentLock('wallet')) {
      setSessionLocked(true);
      setLockMessage("Slot payment is being processed in another tab. Please wait.");
      toast.warn("Payment is being processed in another tab.");
      return;
    }

    lockRef.current = true;
    setIsWalletProcessing(true);

    try {
      await bookSlotViaWallet(slotId!);
      toast.success("✅ Slot booked using wallet!");
      releasePaymentLock();
      navigate("/user/slotsHistory");
    } catch (err: any) {
      console.error("Wallet payment failed:", err);
      const errorMessage = err?.response?.data?.message || "❌ Wallet booking failed";
      
      if (errorMessage.includes("already booked")) {
        toast.error(errorMessage);
        navigate("/user/slotsHistory");
      } else if (errorMessage.includes("Insufficient wallet balance")) {
        toast.error("Insufficient wallet balance.");
      } else {
        toast.error(errorMessage);
      }
      
      releasePaymentLock();
    }
  };

  const handleRetryPayment = () => {
    // Close any existing Razorpay modals first
    if (razorpayInstanceRef.current) {
      try {
        razorpayInstanceRef.current.close();
      } catch (e) {
        // Ignore errors when closing
      }
    }

    // Force release the lock and refresh the page
    localStorage.setItem('slot_payment_processing', 'false');
    toast.info("Payment session reset. Refreshing page...");
    
    // Add a small delay before refresh for toast to show
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleCheckBookedSlots = () => {
    // Don't navigate if this session is actively processing
    if (lockRef.current && razorpayOpenRef.current) {
      toast.warn("Please complete or cancel the current payment first.");
      return;
    }
    navigate("/user/slotsHistory");
  };

  const slot = booking?.slotId || {};
  const instructor = booking?.instructorId || {};
  const slotPrice = slot?.price || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-10 px-6 md:px-20">
        <div className="max-w-2xl mx-auto flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading booking details...</span>
        </div>
      </div>
    );
  }

  // Session locked UI
  if (sessionLocked) {
    return (
      <div className="min-h-screen bg-white py-10 px-6 md:px-20">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">
              {lockPaymentType === 'razorpay' ? '💳' : lockPaymentType === 'wallet' ? '💰' : '⏳'}
            </div>
            <h2 className="text-2xl font-bold text-yellow-800 mb-4">Payment in Progress</h2>
            <p className="text-yellow-700 mb-6">{lockMessage}</p>
            <div className="space-y-4">
              <div className="space-x-4">
                <button
                  onClick={handleCheckBookedSlots}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Check Booked Slots
                </button>
              </div>
              
              {showRetryOption && lockPaymentType === 'razorpay' && (
                <div className="border-t pt-4">
                  <p className="text-sm text-yellow-600 mb-3">
                    ⚠️ If the payment window was closed or is not responding, you can retry the payment.
                    This will reset the payment session.
                  </p>
                  <button
                    onClick={handleRetryPayment}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    🔄 Reset & Retry Payment
                  </button>
                </div>
              )}

              {!showRetryOption && lockPaymentType === 'razorpay' && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">
                    💡 Check your other browser tabs for the payment window, or wait for the retry option to appear.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10 px-6 md:px-20">
      <div className="max-w-2xl mx-auto shadow-lg border rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Confirm Your Slot Booking
        </h2>

        {/* Processing Warning Banner */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <div className="text-blue-800">
                <div className="font-medium">Payment Processing</div>
                <div className="text-sm">Please don't refresh or close this tab until payment is complete.</div>
              </div>
            </div>
          </div>
        )}

        {booking && slot ? (
          <div className="space-y-4">
            <p>
              <strong>Date:</strong>{" "}
              {format(new Date(slot.startTime), "dd-MM-yyyy")}
            </p>
            <p>
              <strong>Time:</strong>{" "}
              {`${format(new Date(slot.startTime), "h:mm a")} - ${format(
                new Date(slot.endTime),
                "h:mm a"
              )}`}
            </p>
            <p>
              <strong>Instructor:</strong> {instructor.username || "N/A"}
            </p>
            <p>
              <strong>Price:</strong> ₹{slotPrice}
            </p>
            <p>
              <strong>Your Wallet Balance:</strong>{" "}
              <span
                className={
                  walletBalance >= slotPrice ? "text-green-600" : "text-red-600"
                }
              >
                ₹{walletBalance}
              </span>
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={handleWalletPayment}
                disabled={isProcessing || sessionLocked || walletBalance < slotPrice}
                className={`px-6 py-2 rounded-lg transition flex items-center justify-center ${
                  isProcessing || sessionLocked || walletBalance < slotPrice
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isWalletProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  `💰 Pay via Wallet (₹${slotPrice})`
                )}
              </button>

              <button
                onClick={handleRazorpayPayment}
                disabled={isProcessing || sessionLocked}
                className={`px-6 py-2 rounded-lg transition flex items-center justify-center ${
                  isProcessing || sessionLocked
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
                  `💳 Pay via Razorpay (₹${slotPrice})`
                )}
              </button>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => navigate("/user/slotsHistory")}
                disabled={isProcessing || sessionLocked}
                className={`font-medium transition-colors ${
                  isProcessing || sessionLocked 
                    ? "text-gray-400 cursor-not-allowed" 
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                ← Back to Slots
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Booking information not available.</p>
            <button
              onClick={() => navigate("/user/slotsHistory")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Back to Slots
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotCheckoutPage;