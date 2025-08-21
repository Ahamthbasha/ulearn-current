import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  membershipInitiateCheckout,
  verifyMembershipPurchase,
  purchaseMembershipWithWallet,
  instructorGetWallet,
} from "../../../api/action/InstructorActionApi";
import { toast } from "react-toastify";
import { CheckCircle } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const MembershipCheckoutPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  
  // Main state
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [orderData, setOrderData] = useState<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    planName: string;
    durationInDays: number;
    description?: string;
    benefits?: string[];
  } | null>(null);

  // Processing states
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const [showRetryOption, setShowRetryOption] = useState(false);
  const [lockPaymentType, setLockPaymentType] = useState<string>("");
  const [lockTimestamp, setLockTimestamp] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  
  // Session management
  const lockRef = useRef(false);
  const sessionId = useRef(`membership_session_${Date.now()}_${Math.random()}`);
  const razorpayOpenRef = useRef(false);
  const razorpayInstanceRef = useRef<any>(null);
  const autoReloadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Computed state for any processing
  const isProcessing = isRazorpayProcessing || isWalletProcessing;

  // Auto-reload effect for session locked state
  useEffect(() => {
    if (sessionLocked && lockTimestamp > 0) {
      // Clear any existing timers
      if (autoReloadTimerRef.current) {
        clearTimeout(autoReloadTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }

      const now = Date.now();
      const elapsedTime = now - lockTimestamp;
      const remainingTime = Math.max(0, 30000 - elapsedTime); // 30 seconds in milliseconds

      if (remainingTime > 0) {
        // Set initial countdown
        setTimeRemaining(Math.ceil(remainingTime / 1000));

        // Start countdown timer (update every second)
        countdownTimerRef.current = setInterval(() => {
          const currentTime = Date.now();
          const currentElapsed = currentTime - lockTimestamp;
          const currentRemaining = Math.max(0, 30000 - currentElapsed);
          
          if (currentRemaining > 0) {
            setTimeRemaining(Math.ceil(currentRemaining / 1000));
          } else {
            setTimeRemaining(0);
          }
        }, 1000);

        // Set auto-reload timer
        autoReloadTimerRef.current = setTimeout(() => {
          toast.info("Auto-reloading page to refresh payment session...");
          localStorage.setItem('membership_payment_processing', 'false');
          window.location.reload();
        }, remainingTime);
      } else {
        // Time already elapsed, reload immediately
        setTimeRemaining(0);
        toast.info("Auto-reloading page to refresh payment session...");
        localStorage.setItem('membership_payment_processing', 'false');
        window.location.reload();
      }
    } else {
      // Clear timers if not session locked
      if (autoReloadTimerRef.current) {
        clearTimeout(autoReloadTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    }

    // Cleanup function
    return () => {
      if (autoReloadTimerRef.current) {
        clearTimeout(autoReloadTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [sessionLocked, lockTimestamp]);

  useEffect(() => {
    if (!planId) return;

    const fetchCheckoutData = async () => {
      try {
        initializeSessionLock();

        const data = await membershipInitiateCheckout(planId);
        setOrderData(data);

        const walletData = await instructorGetWallet();
        if (walletData?.wallet?.balance != null) {
          setWalletBalance(walletData.wallet.balance);
        } else {
          setWalletBalance(0);
        }
      } catch (error) {
        console.error("❌ Checkout initiation error:", error);
        toast.error("Failed to load checkout or wallet data");
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

      // Clear timers
      if (autoReloadTimerRef.current) {
        clearTimeout(autoReloadTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }

      // Only cleanup if this session owns the lock
      const lockData = localStorage.getItem('membership_payment_processing');
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
  }, [planId]);

  const initializeSessionLock = () => {
    // Check if payment is already in progress
    const checkPaymentLock = () => {
      const lockData = localStorage.getItem('membership_payment_processing');
      if (lockData && lockData !== 'false') {
        try {
          const { isLocked, sessionId: lockedSession, timestamp, paymentType } = JSON.parse(lockData);
          const now = Date.now();
          
          // Auto-unlock after 5 minutes (payment timeout)
          if (now - timestamp > 5 * 60 * 1000) {
            localStorage.setItem('membership_payment_processing', 'false');
            setSessionLocked(false);
            setShowRetryOption(false);
            setLockPaymentType("");
            setLockTimestamp(0);
            return;
          }

          if (isLocked && lockedSession !== sessionId.current) {
            setSessionLocked(true);
            setLockPaymentType(paymentType || "");
            setLockTimestamp(timestamp);
            
            // Only show retry option for Razorpay payments after 30 seconds (longer delay)
            // This gives more time for the original payment to complete
            if (paymentType === 'razorpay' && now - timestamp > 30 * 1000) {
              setLockMessage("Membership payment is being processed in another tab. If the payment window was closed or is not responding, you can retry below.");
              setShowRetryOption(true);
            } else {
              const timeRemainingSeconds = Math.ceil((30 * 1000 - (now - timestamp)) / 1000);
              if (paymentType === 'razorpay' && timeRemainingSeconds > 0) {
                setLockMessage(`Membership payment is being processed in another tab. Page will auto-reload in ${timeRemainingSeconds} seconds.`);
              } else {
                setLockMessage("Membership payment is being processed in another tab. Please wait or check your other tabs.");
              }
              setShowRetryOption(false);
            }
          } else {
            setSessionLocked(false);
            setShowRetryOption(false);
            setLockPaymentType("");
            setLockTimestamp(0);
          }
        } catch {
          localStorage.setItem('membership_payment_processing', 'false');
          setSessionLocked(false);
          setShowRetryOption(false);
          setLockPaymentType("");
          setLockTimestamp(0);
        }
      } else {
        setSessionLocked(false);
        setShowRetryOption(false);
        setLockPaymentType("");
        setLockTimestamp(0);
      }
    };

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'membership_payment_processing') {
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
    const lockData = localStorage.getItem('membership_payment_processing');
    
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
    localStorage.setItem('membership_payment_processing', JSON.stringify({
      isLocked: true,
      sessionId: sessionId.current,
      timestamp: Date.now(),
      paymentType: paymentType
    }));
    
    return true;
  };

  const releasePaymentLock = () => {
    // Only release if this session owns the lock
    const lockData = localStorage.getItem('membership_payment_processing');
    if (lockData && lockData !== 'false') {
      try {
        const { sessionId: lockedSession } = JSON.parse(lockData);
        if (lockedSession === sessionId.current) {
          localStorage.setItem('membership_payment_processing', 'false');
        }
      } catch {
        // If parsing fails, clear it anyway
        localStorage.setItem('membership_payment_processing', 'false');
      }
    }
    lockRef.current = false;
    razorpayOpenRef.current = false;
    setIsRazorpayProcessing(false);
    setIsWalletProcessing(false);
    setShowRetryOption(false);
    setLockPaymentType("");
    setLockTimestamp(0);
  };

  const handlePayment = () => {
    if (isProcessing || sessionLocked || lockRef.current) {
      toast.warn("Payment is already being processed.");
      return;
    }

    if (!orderData || !planId) return toast.error("Order data not ready");

    // Try to acquire payment lock
    if (!acquirePaymentLock('razorpay')) {
      setSessionLocked(true);
      setLockMessage("Membership payment is being processed in another tab. Please wait.");
      toast.warn("Payment is being processed in another tab.");
      return;
    }

    lockRef.current = true;
    razorpayOpenRef.current = false;
    setIsRazorpayProcessing(true);

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount * 100,
      currency: orderData.currency,
      name: "uLearn Membership",
      description: `Purchase - ${orderData.planName}`,
      order_id: orderData.razorpayOrderId,
      handler: async function (response: any) {
        try {
          await verifyMembershipPurchase({
            razorpayOrderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            planId,
          });

          toast.success("✅ Membership activated successfully!");
          releasePaymentLock();
          navigate("/instructor/slots");
        } catch (err: any) {
          console.error("Payment verification failed:", err);
          const errorMessage = err?.response?.data?.message || "❌ Payment verification failed";
          
          if (errorMessage.includes("already activated") || 
              errorMessage.includes("Membership already processed")) {
            toast.error(errorMessage);
            navigate("/instructor/slots");
          } else if (errorMessage.includes("Membership purchase failed earlier")) {
            toast.error("This membership purchase failed previously. Please try purchasing a new plan.");
            navigate("/instructor/slots");
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
        name: "Instructor",
        email: "instructor@example.com",
      },
      theme: {
        color: "#1E40AF",
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpayInstanceRef.current = razorpay;
    razorpayOpenRef.current = true;
    
    // Handle payment failures
    razorpay.on('payment.failed', function (response: any) {
      console.error("Razorpay payment failed:", response.error);
      toast.error("Payment failed. Please try again.");
      releasePaymentLock();
    });

    razorpay.open();
  };

  const handleWalletPurchase = async () => {
    if (isProcessing || sessionLocked || lockRef.current) {
      toast.warn("Payment is already being processed.");
      return;
    }

    if (!orderData || !planId) return toast.error("Order data not ready");

    if (walletBalance !== null && walletBalance < orderData.amount) {
      toast.error("❌ Insufficient wallet balance. Please use Razorpay or recharge your wallet.");
      return;
    }

    // Try to acquire payment lock
    if (!acquirePaymentLock('wallet')) {
      setSessionLocked(true);
      setLockMessage("Membership payment is being processed in another tab. Please wait.");
      toast.warn("Payment is being processed in another tab.");
      return;
    }

    lockRef.current = true;
    setIsWalletProcessing(true);

    try {
      await purchaseMembershipWithWallet(planId);
      toast.success("✅ Membership activated using wallet!");
      releasePaymentLock();
      navigate("/instructor/slots");
    } catch (error: any) {
      console.error("Wallet payment failed:", error);
      const errorMessage = error?.response?.data?.message || "❌ Wallet payment failed";
      
      if (errorMessage.includes("already activated")) {
        toast.error(errorMessage);
        navigate("/instructor/slots");
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
    localStorage.setItem('membership_payment_processing', 'false');
    toast.info("Membership payment session reset. Refreshing page...");
    
    // Add a small delay before refresh for toast to show
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleBackToDashboard = () => {
    // Don't navigate if this session is actively processing
    if (lockRef.current && razorpayOpenRef.current) {
      toast.warn("Please complete or cancel the current payment first.");
      return;
    }
    navigate("/instructor/slots");
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
            
            {/* Auto-reload countdown */}
            {timeRemaining > 0 && !showRetryOption && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="text-blue-800">
                  <div className="font-medium">Auto-reload in {timeRemaining} seconds</div>
                  <div className="text-sm">Page will automatically refresh to update payment status</div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-x-4">
                <button
                  onClick={handleBackToDashboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Back to Dashboard
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

              {!showRetryOption && lockPaymentType === 'razorpay' && timeRemaining <= 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">
                    💡 Check your other browser tabs for the payment window, or wait for the page to refresh.
                  </p>
                </div>
              )}
            </div>
          </div>
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
            <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Order</h2>
            <p className="text-red-500 mb-6">Unable to load membership plan details.</p>
            <button
              onClick={() => navigate("/instructor/slots")}
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
              sessionLocked ||
              (walletBalance !== null && walletBalance < orderData.amount)
            }
            className={`flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center ${
              isProcessing ||
              sessionLocked ||
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
            disabled={isProcessing || sessionLocked}
            className={`flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center ${
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
              `💳 Pay with Razorpay (₹${orderData.amount})`
            )}
          </button>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleBackToDashboard}
            disabled={isProcessing || sessionLocked}
            className={`font-medium transition-colors ${
              isProcessing || sessionLocked 
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