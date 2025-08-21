import { useEffect, useState, useRef } from "react";
import {
  getCart,
  initiateCheckout,
  checkoutCompleted,
  removeFromCart,
  getWallet,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

interface Course {
  _id: string;
  courseName: string;
  price: number;
  thumbnailUrl: string;
}

interface Wallet {
  balance: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CheckoutPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "wallet">("razorpay");
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const [showRetryOption, setShowRetryOption] = useState(false);
  const [lockPaymentType, setLockPaymentType] = useState<string>("");
  const navigate = useNavigate();
  const lockRef = useRef(false);
  const sessionId = useRef(`session_${Date.now()}_${Math.random()}`);
  const razorpayOpenRef = useRef(false);
  const razorpayInstanceRef = useRef<any>(null);

  // Computed state for any processing
  const isProcessing = isRazorpayProcessing || isWalletProcessing;

  useEffect(() => {
    fetchCartCourses();
    fetchWalletBalance();
    initializeSessionLock();

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
      const lockData = localStorage.getItem('payment_processing');
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
  }, []);

  const initializeSessionLock = () => {
    // Check if payment is already in progress
    const checkPaymentLock = () => {
      const lockData = localStorage.getItem('payment_processing');
      if (lockData && lockData !== 'false') {
        try {
          const { isLocked, sessionId: lockedSession, timestamp, paymentType } = JSON.parse(lockData);
          const now = Date.now();
          
          // Auto-unlock after 5 minutes (payment timeout)
          if (now - timestamp > 5 * 60 * 1000) {
            localStorage.setItem('payment_processing', 'false');
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
              setLockMessage("Course payment is being processed in another tab. If the payment window was closed or is not responding, you can retry below.");
              setShowRetryOption(true);
            } else {
              const timeRemaining = Math.ceil((30 * 1000 - (now - timestamp)) / 1000);
              if (paymentType === 'razorpay' && timeRemaining > 0) {
                setLockMessage(`Course payment is being processed in another tab. Retry option will be available in ${timeRemaining} seconds.`);
              } else {
                setLockMessage("Course payment is being processed in another tab. Please wait or check your other tabs.");
              }
              setShowRetryOption(false);
            }
          } else {
            setSessionLocked(false);
            setShowRetryOption(false);
            setLockPaymentType("");
          }
        } catch {
          localStorage.setItem('payment_processing', 'false');
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
      if (e.key === 'payment_processing') {
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
    const lockData = localStorage.getItem('payment_processing');
    
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
    localStorage.setItem('payment_processing', JSON.stringify({
      isLocked: true,
      sessionId: sessionId.current,
      timestamp: Date.now(),
      paymentType: paymentType
    }));
    
    return true;
  };

  const releasePaymentLock = () => {
    // Only release if this session owns the lock
    const lockData = localStorage.getItem('payment_processing');
    if (lockData && lockData !== 'false') {
      try {
        const { sessionId: lockedSession } = JSON.parse(lockData);
        if (lockedSession === sessionId.current) {
          localStorage.setItem('payment_processing', 'false');
        }
      } catch {
        // If parsing fails, clear it anyway
        localStorage.setItem('payment_processing', 'false');
      }
    }
    lockRef.current = false;
    razorpayOpenRef.current = false;
    setIsRazorpayProcessing(false);
    setIsWalletProcessing(false);
    setShowRetryOption(false);
    setLockPaymentType("");
  };

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

  const handleRazorpayPayment = async () => {
    if (isProcessing || sessionLocked || lockRef.current) {
      toast.warn("Payment is already being processed.");
      return;
    }

    if (courses.length === 0) {
      toast.warn("No courses to checkout.");
      return;
    }

    // Try to acquire payment lock
    if (!acquirePaymentLock('razorpay')) {
      setSessionLocked(true);
      setLockMessage("Payment is being processed in another tab. Please wait.");
      toast.warn("Payment is being processed in another tab.");
      return;
    }

    lockRef.current = true;
    razorpayOpenRef.current = false;
    setIsRazorpayProcessing(true);

    try {
      const courseIds = courses.map((c) => c._id);
      const response = await initiateCheckout(courseIds, totalAmount, "razorpay");
      const order = response?.order;

      if (!order || !order.gatewayOrderId) {
        toast.error("Failed to initiate order with Razorpay.");
        releasePaymentLock();
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
            releasePaymentLock();
            navigate("/user/enrolled");
          } catch (error: any) {
            console.error("Payment verification failed:", error);
            const errorMessage = error?.response?.data?.message || "Payment verification failed.";
            
            if (errorMessage.includes("Order already processed")) {
              toast.error("This order has already been processed.");
              navigate("/user/enrolled");
            } else if (errorMessage.includes("already enrolled") || 
                       errorMessage.includes("Payment cancelled")) {
              toast.error(errorMessage);
              navigate("/user/enrolled");
            } else if (errorMessage.includes("Order failed earlier")) {
              toast.error("This order failed previously. Please start a new checkout.");
              navigate("/user/cart");
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
        theme: {
          color: "#3399cc",
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
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      const errorMessage = error?.response?.data?.message;
      
      if (errorMessage?.includes("already enrolled")) {
        toast.error(errorMessage);
        navigate("/user/enrolled");
      } else {
        toast.error("Payment initiation failed.");
      }
      
      releasePaymentLock();
    }
  };

  const handleWalletPayment = async () => {
    if (isProcessing || sessionLocked || lockRef.current) {
      toast.warn("Payment is already being processed.");
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

    // Try to acquire payment lock
    if (!acquirePaymentLock('wallet')) {
      setSessionLocked(true);
      setLockMessage("Payment is being processed in another tab. Please wait.");
      toast.warn("Payment is being processed in another tab.");
      return;
    }

    lockRef.current = true;
    setIsWalletProcessing(true);

    try {
      const courseIds = courses.map((c) => c._id);
      await initiateCheckout(courseIds, totalAmount, "wallet");
      
      toast.success("Payment successful via wallet! You've been enrolled.");
      releasePaymentLock();
      navigate("/user/enrolled");
    } catch (error: any) {
      console.error("Wallet payment error:", error);
      const errorMessage = error?.response?.data?.message;
      
      if (errorMessage?.includes("already enrolled")) {
        toast.error(errorMessage);
        navigate("/user/enrolled");
      } else if (errorMessage?.includes("Insufficient wallet balance")) {
        toast.error("Insufficient wallet balance.");
      } else {
        toast.error("Wallet payment failed.");
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
    localStorage.setItem('payment_processing', 'false');
    toast.info("Payment session reset. Refreshing page...");
    
    // Add a small delay before refresh for toast to show
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handlePayment = () => {
    if (paymentMethod === "razorpay") {
      handleRazorpayPayment();
    } else {
      handleWalletPayment();
    }
  };

  const handleRemove = async (courseId: string, courseName: string) => {
    if (isProcessing || sessionLocked) {
      toast.warn("Cannot modify cart during payment process.");
      return;
    }

    try {
      await removeFromCart(courseId);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      toast.info(`${courseName} removed from cart.`);
    } catch {
      toast.error("Failed to remove course.");
    }
  };

  const handleCheckEnrolledCourses = () => {
    // Don't navigate if this session is actively processing
    if (lockRef.current && razorpayOpenRef.current) {
      toast.warn("Please complete or cancel the current payment first.");
      return;
    }
    navigate("/user/enrolled");
  };

  const handleBackToCart = () => {
    // Don't navigate if this session is actively processing
    if (lockRef.current && razorpayOpenRef.current) {
      toast.warn("Please complete or cancel the current payment first.");
      return;
    }
    navigate("/user/cart");
  };

  const canProceedWithWallet = wallet && wallet.balance >= totalAmount;

  // Session locked UI
  if (sessionLocked) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">
            {lockPaymentType === 'razorpay' ? '💳' : lockPaymentType === 'wallet' ? '💰' : '⏳'}
          </div>
          <h2 className="text-2xl font-bold text-yellow-800 mb-4">Payment in Progress</h2>
          <p className="text-yellow-700 mb-6">{lockMessage}</p>
          <div className="space-y-4">
            <div className="space-x-4">
              <button
                onClick={handleCheckEnrolledCourses}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Check Enrolled Courses
              </button>
              <button
                onClick={handleBackToCart}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Back to Cart
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
    );
  }

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

          {/* Courses Table */}
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
                          disabled={isProcessing || sessionLocked}
                          className={`text-sm px-3 py-1 rounded transition-colors ${
                            isProcessing || sessionLocked
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

          {/* Wallet Balance */}
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

          {/* Payment Method Selection */}
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Payment Method</h3>
            <div className="space-y-3">
              <label
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === "razorpay" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                } ${isProcessing || sessionLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                  disabled={isProcessing || sessionLocked}
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
                } ${isProcessing || sessionLocked || !canProceedWithWallet ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  value="wallet"
                  checked={paymentMethod === "wallet"}
                  onChange={() => setPaymentMethod("wallet")}
                  disabled={isProcessing || sessionLocked || !canProceedWithWallet}
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

          {/* Payment Buttons */}
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Payment</h3>
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={handleWalletPayment}
                disabled={
                  isProcessing || 
                  sessionLocked || 
                  !canProceedWithWallet ||
                  paymentMethod !== "wallet"
                }
                className={`flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center ${
                  isProcessing || 
                  sessionLocked || 
                  !canProceedWithWallet ||
                  paymentMethod !== "wallet"
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
                  sessionLocked || 
                  paymentMethod !== "razorpay"
                }
                className={`flex-1 px-6 py-3 rounded-lg transition flex items-center justify-center ${
                  isProcessing || 
                  sessionLocked || 
                  paymentMethod !== "razorpay"
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

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBackToCart}
              disabled={isProcessing || sessionLocked}
              className={`font-medium transition-colors ${
                isProcessing || sessionLocked 
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
                sessionLocked || 
                courses.length === 0 || 
                (paymentMethod === "wallet" && !canProceedWithWallet)
              }
              className={`${
                isProcessing || 
                sessionLocked || 
                courses.length === 0 || 
                (paymentMethod === "wallet" && !canProceedWithWallet)
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
                <>
                  💸 Pay ₹{totalAmount.toLocaleString()}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutPage;