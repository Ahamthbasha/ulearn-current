import { useEffect, useState, useRef } from "react";
import {
  getCart,
  getWallet,
  initiateCheckout,
  checkoutCompleted,
  removeFromCart,
  cancelPendingOrder,
  markFailed,
  getAllCoupons,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import type { checkoutCartItem,Wallet, ICoupon} from "../interface/studentInterface";

const CheckoutPage = () => {
  const [cartItems, setCartItems] = useState<checkoutCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "wallet">("razorpay");
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  const [isCancelProcessing, setIsCancelProcessing] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<ICoupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<ICoupon | null>(null);
  const [discountedAmount, setDiscountedAmount] = useState<number | null>(null);
  const [isCouponDropdownOpen, setIsCouponDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const razorpayInstanceRef = useRef<any>(null);

  const isProcessing = isRazorpayProcessing || isWalletProcessing || isCancelProcessing;

  useEffect(() => {
    fetchCartItems();
    fetchWalletBalance();
    fetchAvailableCoupons();

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

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      const items: checkoutCartItem[] = (response || []).map((item: any) => {
        if (!item.itemId || !item.type || !item.title || item.price == null || !item.thumbnailUrl) {
          throw new Error("Invalid cart item data");
        }
        return {
          _id: item.itemId,
          type: item.type as "course" | "learningPath",
          title: item.title,
          price: Number(item.price),
          thumbnailUrl: item.thumbnailUrl,
          isAlreadyEnrolled: item.isAlreadyEnrolled, // Map new field
          enrolledCourses: item.enrolledCourses, // Map new field
        };
      });

      // Show toast for learning paths with enrolled courses
      items.forEach((item) => {
        if (item.type === "learningPath" && item.enrolledCourses?.length) {
          toast.info(
            `Some courses in "${item.title}" are already enrolled and will not be charged.`,
            { autoClose: 5000 }
          );
        }
        if (item.type === "course" && item.isAlreadyEnrolled) {
          toast.info(
            `"${item.title}" is already enrolled and will not be charged.`,
            { autoClose: 5000 }
          );
        }
      });

      setCartItems(items);
    } catch (error) {
      toast.error("Failed to load cart for checkout.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await getWallet();
      if (!res?.wallet || res.wallet.balance == null) {
        throw new Error("Invalid wallet data");
      }
      setWallet({ balance: Number(res.wallet.balance) });
    } catch (error) {
      toast.error("Failed to fetch wallet balance.");
      setWallet({ balance: 0 });
    }
  };

  const fetchAvailableCoupons = async () => {
    try {
      const response = await getAllCoupons();
      const coupons: ICoupon[] = (response.data || []).map((coupon: any) => {
        if (
          !coupon._id ||
          !coupon.code ||
          coupon.discount == null ||
          !coupon.expiryDate ||
          coupon.status == null ||
          !coupon.usedBy ||
          coupon.minPurchase == null ||
          coupon.maxDiscount == null
        ) {
          throw new Error("Invalid coupon data");
        }
        return {
          _id: coupon._id,
          code: coupon.code,
          discount: Number(coupon.discount),
          expiryDate: coupon.expiryDate,
          status: coupon.status,
          usedBy: coupon.usedBy,
          minPurchase: Number(coupon.minPurchase),
          maxDiscount: Number(coupon.maxDiscount),
        };
      });
      setAvailableCoupons(coupons);
    } catch (error) {
      toast.error("Failed to fetch available coupons.");
    }
  };

  // Adjusted totalAmount to exclude prices of already enrolled courses
  const totalAmount = cartItems.reduce((sum, item) => {
    if (item.isAlreadyEnrolled && item.type === "course") return sum;
    return sum + item.price;
  }, 0);

  const handleBackendError = async (error: any, paymentType: "razorpay" | "wallet") => {
    let errorMessage = error?.response?.data?.message || error?.message || "An unexpected error occurred";
    const orderId = error?.response?.data?.orderId;

    if (errorMessage.includes("Request failed with status code 500") && error?.response?.data?.message) {
      const backendLogMatch = error?.response?.data?.message.match(/Already enrolled in (.+)\./);
      if (backendLogMatch) {
        errorMessage = `Already enrolled in ${backendLogMatch[1]}.`;
      }
    }

    console.log("Backend error details:", {
      errorMessage,
      orderId,
      rawResponseData: error?.response?.data,
      fullError: error,
    });

    if (errorMessage.includes("they are included in the learning path(s)")) {
      toast.error(`${errorMessage} Please remove the overlapping course(s) from your cart.`);
    } else if (errorMessage.includes("A pending order already exists")) {
      toast.error(
        "A payment is already in progress for these items. Cancel it to proceed with a new payment or wait 15 minutes for it to expire.",
      );
      if (orderId) {
        setPendingOrderId(orderId);
      } else {
        console.error("No orderId in pending order error response");
        toast.error("Unable to identify pending order. Please try again later.");
      }
    } else if (errorMessage.includes("already enrolled")) {
      const match = errorMessage.match(/Already enrolled in (.+)\./);
      const enrolledTitle = match ? match[1] : "unknown item";

      const enrolledItem = cartItems.find(
        (item) => item.title.toLowerCase() === enrolledTitle.toLowerCase()
      );

      if (enrolledItem) {
        const confirmRemove = window.confirm(
          `You are already enrolled in "${enrolledTitle}". Would you like to remove it from your cart and retry checkout?`
        );
        if (confirmRemove) {
          try {
            await removeFromCart(enrolledItem._id, enrolledItem.type);
            setCartItems((prev) => prev.filter((item) => item._id !== enrolledItem._id));
            setSelectedCoupon(null);
            setDiscountedAmount(null);
            toast.info(
              `"${enrolledTitle}" has been removed from your cart. You can now retry checkout.`,
            );
          } catch (removeError: any) {
            toast.error(
              `Failed to remove "${enrolledTitle}" from cart: ${
                removeError?.response?.data?.message || "Unknown error"
              }`
            );
          }
        } else {
          toast.info(
            `Please remove "${enrolledTitle}" from your cart to proceed with checkout.`
          );
        }
      } else {
        toast.error(
          `You are already enrolled in "${enrolledTitle}". Please remove it from your cart or check your enrolled items.`
        );
        navigate("/user/enrolled");
      }
    } else if (errorMessage.includes("Order already processed")) {
      toast.success("Payment already completed! Redirecting to enrolled items.");
      navigate("/user/enrolled");
    } else if (errorMessage.includes("Payment cancelled")) {
      toast.error(errorMessage);
    } else if (errorMessage.includes("Order failed earlier")) {
      toast.error("This order failed previously. Please start a new checkout.");
    } else if (errorMessage.includes("Order was cancelled")) {
      toast.error("This order was cancelled. Please start a new checkout.");
    } else if (errorMessage.includes("Insufficient wallet balance")) {
      toast.error("Insufficient wallet balance. Please use Razorpay or recharge your wallet.");
      setPaymentMethod("razorpay");
    } else if (errorMessage.includes("Order not found")) {
      toast.error("Order not found. Please try again.");
    } else if (errorMessage.includes("Invalid coupon")) {
      toast.error("Invalid coupon. Please select a valid coupon.");
      setSelectedCoupon(null);
      setDiscountedAmount(null);
    } else if (errorMessage.includes("Coupon is expired or inactive")) {
      toast.error("Selected coupon is expired or inactive.");
      setSelectedCoupon(null);
      setDiscountedAmount(null);
    } else if (errorMessage.includes("Minimum purchase amount")) {
      toast.error(errorMessage);
      setSelectedCoupon(null);
      setDiscountedAmount(null);
    } else if (errorMessage.includes("Coupon already used by this user")) {
      toast.error("This coupon has already been used by you.");
      setSelectedCoupon(null);
      setDiscountedAmount(null);
    } else if (
      errorMessage.includes("userId and courseId are required") ||
      errorMessage.includes("userId and learningPathId are required")
    ) {
      toast.error("Invalid enrollment data. Please try again.");
    } else {
      toast.error(
        `${paymentType === "razorpay" ? "Payment" : "Wallet payment"} failed: ${errorMessage}`,
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

    if (cartItems.length === 0) {
      toast.warn("No items to checkout.");
      return;
    }

    if (!window.Razorpay) {
      toast.error("Razorpay is not available. Please try again later.");
      return;
    }

    setIsRazorpayProcessing(true);

    try {
      const courseIds = cartItems.filter((item) => item.type === "course").map((item) => item._id);
      const learningPathIds = cartItems.filter((item) => item.type === "learningPath").map((item) => item._id);
      const response = await initiateCheckout(courseIds, learningPathIds, totalAmount, "razorpay", selectedCoupon?._id);
      const order = response?.order;

      if (!order || !order._id || !order.gatewayOrderId || order.amount == null) {
        throw new Error("Invalid order data from backend");
      }

      setDiscountedAmount(order.amount);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount * 100,
        currency: "INR",
        name: "ULearn",
        description: "Course or Learning Path Purchase",
        order_id: order.gatewayOrderId,
        handler: async function (razorpayResponse: any) {
          try {
            if (!razorpayResponse.razorpay_payment_id) {
              throw new Error("Invalid Razorpay payment response");
            }
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

    if (cartItems.length === 0) {
      toast.warn("No items to checkout.");
      return;
    }

    if (!wallet || wallet.balance < (discountedAmount || totalAmount)) {
      toast.error("Insufficient wallet balance. Please use Razorpay or recharge your wallet.");
      return;
    }

    setIsWalletProcessing(true);

    try {
      const courseIds = cartItems.filter((item) => item.type === "course").map((item) => item._id);
      const learningPathIds = cartItems.filter((item) => item.type === "learningPath").map((item) => item._id);
      const response = await initiateCheckout(courseIds, learningPathIds, totalAmount, "wallet", selectedCoupon?._id);
      if (!response?.order || response.order.amount == null) {
        throw new Error("Invalid order data from backend");
      }
      setDiscountedAmount(response.order.amount);

      toast.success("Payment successful via wallet! You've been enrolled.");
      navigate("/user/enrolled");
    } catch (error: any) {
      handleBackendError(error, "wallet");
    } finally {
      setIsWalletProcessing(false);
      await fetchWalletBalance();
    }
  };

  const handlePayment = debounce(() => {
    if (paymentMethod === "razorpay") {
      handleRazorpayPayment();
    } else {
      handleWalletPayment();
    }
  }, 1000);

  const handleRemove = async (itemId: string, title: string, type: "course" | "learningPath") => {
    if (isProcessing) {
      toast.warn("Cannot modify cart during payment or cancellation process.");
      return;
    }

    try {
      await removeFromCart(itemId, type);
      setCartItems((prev) => prev.filter((item) => item._id !== itemId));
      setSelectedCoupon(null);
      setDiscountedAmount(null);
      toast.info(`${title} removed from cart.`);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message;
      if (errorMessage?.includes("already enrolled")) {
        toast.info(`${title} is already enrolled, removing from cart.`);
        setCartItems((prev) => prev.filter((item) => item._id !== itemId));
        setSelectedCoupon(null);
        setDiscountedAmount(null);
      } else {
        toast.error(`Failed to remove ${title}.`);
      }
    }
  };

  const handleBackToCart = () => {
    navigate("/user/cart");
  };

  const canProceedWithWallet = wallet && wallet.balance >= (discountedAmount || totalAmount);

  const handleApplyCoupon = (coupon: ICoupon) => {
    if (totalAmount < coupon.minPurchase) {
      toast.error(`Minimum purchase amount of ₹${coupon.minPurchase} required for this coupon`);
      return;
    }
    setSelectedCoupon(coupon);
    const discountAmount = (totalAmount * coupon.discount) / 100;
    let finalAmount = totalAmount - discountAmount;
    if (coupon.maxDiscount && finalAmount < totalAmount - coupon.maxDiscount) {
      finalAmount = totalAmount - coupon.maxDiscount;
    }
    setDiscountedAmount(finalAmount);
    toast.success(`Coupon ${coupon.code} applied successfully!`);
    setIsCouponDropdownOpen(false);
  };

  const handleRemoveCoupon = () => {
    setSelectedCoupon(null);
    setDiscountedAmount(null);
    toast.info("Coupon removed.");
  };

  const toggleCouponDropdown = () => {
    setIsCouponDropdownOpen((prev) => !prev);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🧾 Checkout Summary</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading your cart...</span>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-6">Browse our courses and learning paths to get started!</p>
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
                    <div className="text-sm">A payment is in progress for these items. Cancel it to start a new payment or wait 15 minutes for it to expire.</div>
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
                      Item
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
                  {cartItems.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-20 h-14 object-cover rounded-lg shadow-sm"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {item.title} ({item.type === "course" ? "Course" : "Learning Path"})
                            </div>
                            {item.isAlreadyEnrolled && item.type === "course" && (
                              <div className="text-xs text-green-600">
                                Already enrolled - no additional cost
                              </div>
                            )}
                            {item.type === "learningPath" && item.enrolledCourses?.length && (
                              <div className="text-xs text-green-600">
                                Some courses already enrolled - excluded from total
                              </div>
                            )}
                            {item.type === "learningPath" && item.price === 0 && (
                              <div className="text-xs text-yellow-600">
                                All courses enrolled - please remove this learning path
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          ₹{item.price.toLocaleString()}
                        </div>
                        {item.isAlreadyEnrolled && item.type === "course" && (
                          <div className="text-sm text-gray-500">
                            Effective: ₹0
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleRemove(item._id, item.title, item.type)}
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
                  {discountedAmount !== null && (
                    <tr>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">
                        Discounted Amount:
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="text-xl font-bold text-green-600">
                          ₹{discountedAmount.toLocaleString()}
                        </div>
                      </td>
                      <td />
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Apply Coupon</h3>
            <div
              className="cursor-pointer p-3 border rounded-lg transition-colors hover:bg-gray-50"
              onClick={toggleCouponDropdown}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Select a Coupon</span>
                <span>{isCouponDropdownOpen ? "▲" : "▼"}</span>
              </div>
            </div>
            {isCouponDropdownOpen && availableCoupons.length > 0 && (
              <div className="mt-4 space-y-2">
                {availableCoupons.map((coupon) => (
                  <div
                    key={coupon._id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <span>
                      {coupon.code} - {coupon.discount}% (Min. ₹{coupon.minPurchase})
                    </span>
                    <button
                      onClick={() => handleApplyCoupon(coupon)}
                      disabled={selectedCoupon?.code === coupon.code}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedCoupon?.code === coupon.code
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {selectedCoupon?.code === coupon.code ? "Applied" : "Apply"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {selectedCoupon && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-green-600 font-medium">
                  Coupon {selectedCoupon.code} applied! Discount: {selectedCoupon.discount}%
                  {discountedAmount !== null && (
                    <span> - Final Amount: ₹{discountedAmount.toLocaleString()}</span>
                  )}
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove Coupon
                </button>
              </div>
            )}
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
                onClick={handlePayment}
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
                  `💰 Pay via Wallet (₹${(discountedAmount || totalAmount).toLocaleString()})`
                )}
              </button>

              <button
                onClick={handlePayment}
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
                  `💳 Pay via Razorpay (₹${(discountedAmount || totalAmount).toLocaleString()})`
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
                cartItems.length === 0 ||
                (paymentMethod === "wallet" && !canProceedWithWallet) ||
                !!pendingOrderId
              }
              className={`${
                isProcessing ||
                cartItems.length === 0 ||
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
                `Pay ₹${(discountedAmount || totalAmount).toLocaleString()}`
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutPage;