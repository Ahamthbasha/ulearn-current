
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
import type {
  checkoutCartItem,
  Wallet,
  ICoupon,
  RawCartItem,
} from "../interface/studentInterface";
import type { ApiError, RazorpayInstance, RazorpayOptions, RazorpayResponse } from "../../../types/interfaces/ICommon";

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
  const razorpayInstanceRef = useRef<RazorpayInstance | null>(null);

  const isProcessing = isRazorpayProcessing || isWalletProcessing || isCancelProcessing;

  // ------------------------------------------------------------------------
useEffect(() => {
  fetchCartItems();
  fetchWalletBalance();
  fetchAvailableCoupons();

  return () => {
    if (razorpayInstanceRef.current && razorpayInstanceRef.current.close) {
      try {
        razorpayInstanceRef.current.close();
      } catch (e) {
        console.error("Error closing Razorpay modal:", e);
      }
    }
  };
}, []);

const isValidRawCartItem = (raw: unknown): raw is RawCartItem => {
  return (
    typeof raw === "object" &&
    raw !== null &&
    "itemId" in raw &&
    "type" in raw &&
    "title" in raw &&
    "price" in raw &&
    "thumbnailUrl" in raw
  );
};

// Helper function to safely extract title from unknown data
const extractTitle = (raw: unknown): string => {
  if (
    typeof raw === "object" &&
    raw !== null &&
    "title" in raw &&
    typeof (raw as { title: unknown }).title === "string"
  ) {
    return (raw as { title: string }).title;
  }
  return "unknown";
};

const fetchCartItems = async () => {
  try {
    setLoading(true);
    const response = await getCart();
    const rawItems = response || [];

    const validItems: checkoutCartItem[] = [];
    const errors: string[] = [];

    for (const raw of rawItems) {
      if (!isValidRawCartItem(raw)) {
        const rawTitle = extractTitle(raw);
        errors.push(`Invalid data for item "${rawTitle}"`);
        continue;
      }

      // Now TypeScript knows raw is RawCartItem
      const cartItem: checkoutCartItem = {
        _id: raw.itemId,
        type: raw.type as "course" | "learningPath",
        title: raw.title,
        price: Number(raw.price),
        thumbnailUrl: raw.thumbnailUrl,
        isAlreadyEnrolled: raw.isAlreadyEnrolled ?? false,
        enrolledCourses: raw.enrolledCourses ?? [],
      };

      if (cartItem.type === "course" && cartItem.isAlreadyEnrolled) {
        toast.info(`"${cartItem.title}" is already enrolled and will not be charged.`, {
          autoClose: 5000,
        });
      }

      if (cartItem.type === "learningPath" && (cartItem.enrolledCourses?.length ?? 0) > 0) {
        toast.info(
          `Some courses in "${cartItem.title}" are already enrolled and will not be charged.`,
          { autoClose: 5000 }
        );
      }

      validItems.push(cartItem);
    }

    if (errors.length > 0) {
      errors.forEach((msg) => toast.error(msg));
    }

    setCartItems(validItems);
  } catch (error) {
    const apiError = error as ApiError;
    const msg =
      apiError.response?.data?.message ||
      apiError.message ||
      "Failed to load cart for checkout.";
    toast.error(msg);
  } finally {
    setLoading(false);
  }
};

  const fetchWalletBalance = async () => {
    try {
      const res = await getWallet();
      if (!res?.wallet || typeof res.wallet.balance !== "number") {
        throw new Error("Invalid wallet data");
      }
      setWallet({ balance: res.wallet.balance });
    } catch (error) {
      toast.error("Failed to fetch wallet balance or wallet balance is zero");
      setWallet({ balance: 0 });
    }
  };

  const fetchAvailableCoupons = async () => {
    try {
      const response = await getAllCoupons();
      const coupons: ICoupon[] = (response.data || []).map((coupon: unknown) => {
        if (
          typeof coupon !== "object" ||
          !coupon ||
          !("_id" in coupon) ||
          !("code" in coupon) ||
          !("discount" in coupon) ||
          !("expiryDate" in coupon) ||
          !("status" in coupon) ||
          !("usedBy" in coupon) ||
          !("minPurchase" in coupon) ||
          !("maxDiscount" in coupon)
        ) {
          throw new Error("Invalid coupon data");
        }

        const typed = coupon as {
          _id: string;
          code: string;
          discount: number | string;
          expiryDate: string;
          status: string;
          usedBy: string[];
          minPurchase: number | string;
          maxDiscount: number | string;
        };

        return {
          _id: typed._id,
          code: typed.code,
          discount: Number(typed.discount),
          expiryDate: typed.expiryDate,
          status: typed.status,
          usedBy: typed.usedBy,
          minPurchase: Number(typed.minPurchase),
          maxDiscount: Number(typed.maxDiscount),
        };
      });
      setAvailableCoupons(coupons);
    } catch (error) {
      toast.error("Failed to fetch available coupons.");
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => {
    if (item.isAlreadyEnrolled && item.type === "course") return sum;
    return sum + item.price;
  }, 0);

const getBackendErrorMessage = (error: unknown): string => {
  const apiError = error as ApiError;
  
  if (apiError?.response?.data?.message) {
    return apiError.response.data.message;
  }
  
  if (apiError?.response?.data?.error) {
    return apiError.response.data.error;
  }
  
  if (apiError?.message) {
    return apiError.message;
  }
  
  return "An unexpected error occurred";
};


const handleBackendError = (error: unknown, paymentType: "razorpay" | "wallet") => {
  const message = getBackendErrorMessage(error);
  const apiError = error as ApiError;
  const orderId = apiError?.response?.data?.orderId || null;

  if (message.includes("already enrolled")) {
    const match = message.match(/Already enrolled in (.+)\./);
    const enrolledTitle = match ? match[1] : "an item";
    const enrolledItem = cartItems.find((i) =>
      i.title.toLowerCase().includes(enrolledTitle.toLowerCase())
    );
    if (enrolledItem) {
      const confirmRemove = window.confirm(
        `You are already enrolled in "${enrolledItem.title}". Remove from cart and retry?`
      );
      if (confirmRemove) {
        handleRemove(enrolledItem._id, enrolledItem.title, enrolledItem.type);
      }
    } else {
      toast.error(`Already enrolled in "${enrolledTitle}". Please remove from cart.`);
      navigate("/user/enrolled");
    }
  } else if (message.includes("not available for purchase")) {
    toast.error(message);
  } else if (message.includes("A pending order already exists")) {
    toast.error("A payment is already in progress. Cancel it to proceed with a new payment.");
    if (orderId) setPendingOrderId(orderId);
  } else if (message.includes("Order already processed")) {
    toast.success("Payment already completed! Redirecting...");
    navigate("/user/enrolled");
  } else if (message.includes("Insufficient wallet balance")) {
    toast.error("Insufficient wallet balance. Please use Razorpay.");
    setPaymentMethod("razorpay");
  } else if (
    message.includes("Invalid coupon") ||
    message.includes("Coupon is expired") ||
    message.includes("Minimum purchase") ||
    message.includes("Coupon already used")
  ) {
    toast.error(message);
    setSelectedCoupon(null);
    setDiscountedAmount(null);
  } else {
    toast.error(
      `${paymentType === "razorpay" ? "Payment" : "Wallet payment"} failed: ${message}`
    );
  }
};


  const handleCancelPendingOrder = async () => {
    if (!pendingOrderId) return;
    setIsCancelProcessing(true);
    try {
      await cancelPendingOrder(pendingOrderId);
      toast.success("Pending order cancelled. You can now proceed.");
      setPendingOrderId(null);
    } catch (error) {
      toast.error(getBackendErrorMessage(error));
    } finally {
      setIsCancelProcessing(false);
    }
  };

  const markOrderAsFailed = async (orderId: string) => {
    try {
      await markFailed(orderId);
      toast.error("Payment failed. Order marked as failed.");
      navigate("/user/order", { replace: true });
    } catch (error) {
      toast.error(getBackendErrorMessage(error));
    } finally {
      setIsRazorpayProcessing(false);
    }
  };


const handleRazorpayPayment = async () => {
  if (isProcessing || cartItems.length === 0 || !window.Razorpay) {
    toast.warn("Please wait or try again later.");
    return;
  }
  setIsRazorpayProcessing(true);

  try {
    const courseIds = cartItems.filter((i) => i.type === "course").map((i) => i._id);
    const learningPathIds = cartItems
      .filter((i) => i.type === "learningPath")
      .map((i) => i._id);

    const response = await initiateCheckout(
      courseIds,
      learningPathIds,
      totalAmount,
      "razorpay",
      selectedCoupon?._id
    );

    const order = response?.order;
    if (!order?._id || !order.gatewayOrderId || order.amount == null) {
      throw new Error("Invalid order data");
    }

    setDiscountedAmount(order.amount);

    const options: RazorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount * 100,
      currency: "INR",
      name: "ULearn",
      description: "Course or Learning Path Purchase",
      order_id: order.gatewayOrderId,
      handler: async (razorpayResponse: RazorpayResponse) => {
        try {
          if (!razorpayResponse.razorpay_payment_id) throw new Error("Payment ID missing");
          await checkoutCompleted({
            orderId: order._id,
            paymentId: razorpayResponse.razorpay_payment_id,
            method: "razorpay",
            amount: order.amount,
          });
          toast.success("Payment successful! Enrolled.");
          navigate("/user/enrolled");
        } catch (error) {
          handleBackendError(error, "razorpay");
        } finally {
          setIsRazorpayProcessing(false);
        }
      },
      modal: {
        ondismiss: () => markOrderAsFailed(order._id),
        onhidden: () => setIsRazorpayProcessing(false),
      },
      theme: { color: "#3399cc" },
    };

    const rzp = new window.Razorpay(options);
    razorpayInstanceRef.current = rzp;
    rzp.on("payment.failed", () => markOrderAsFailed(order._id));
    rzp.open();
  } catch (error) {
    handleBackendError(error, "razorpay");
    setIsRazorpayProcessing(false);
  }
};

  const handleWalletPayment = async () => {
    if (
      isProcessing ||
      cartItems.length === 0 ||
      !wallet ||
      wallet.balance < (discountedAmount || totalAmount)
    ) {
      toast.error("Insufficient balance or processing. Please try Razorpay.");
      return;
    }

    setIsWalletProcessing(true);

    try {
      const courseIds = cartItems.filter((i) => i.type === "course").map((i) => i._id);
      const learningPathIds = cartItems
        .filter((i) => i.type === "learningPath")
        .map((i) => i._id);

      const response = await initiateCheckout(
        courseIds,
        learningPathIds,
        totalAmount,
        "wallet",
        selectedCoupon?._id
      );

      if (!response?.order?.amount) throw new Error("Invalid order");

      setDiscountedAmount(response.order.amount);
      toast.success("Wallet payment successful! Enrolled.");
      navigate("/user/enrolled");
    } catch (error) {
      handleBackendError(error, "wallet");
    } finally {
      setIsWalletProcessing(false);
      await fetchWalletBalance();
    }
  };

  // ------------------------------------------------------------------------
  const handlePayment = debounce(() => {
    paymentMethod === "razorpay" ? handleRazorpayPayment() : handleWalletPayment();
  }, 1000);

  const handleRemove = async (itemId: string, title: string, type: "course" | "learningPath") => {
    if (isProcessing) return;

    try {
      await removeFromCart(itemId, type);
      setCartItems((prev) => prev.filter((i) => i._id !== itemId));
      setSelectedCoupon(null);
      setDiscountedAmount(null);
      toast.info(`${title} removed.`);
    } catch (error) {
      const msg = getBackendErrorMessage(error);
      if (msg.includes("already enrolled")) {
        setCartItems((prev) => prev.filter((i) => i._id !== itemId));
        toast.info(`${title} already enrolled, removed.`);
      } else {
        toast.error(`Failed to remove ${title}.`);
      }
    }
  };

  // ------------------------------------------------------------------------
  const canProceedWithWallet =
    wallet && wallet.balance >= (discountedAmount || totalAmount);

  const handleApplyCoupon = (coupon: ICoupon) => {
    if (totalAmount < coupon.minPurchase) {
      toast.error(`Min ₹${coupon.minPurchase} required`);
      return;
    }
    setSelectedCoupon(coupon);
    const discount = (totalAmount * coupon.discount) / 100;
    const final = Math.max(
      totalAmount - discount,
      totalAmount - (coupon.maxDiscount || 0)
    );
    setDiscountedAmount(final);
    toast.success(`Coupon ${coupon.code} applied!`);
    setIsCouponDropdownOpen(false);
  };

  const handleRemoveCoupon = () => {
    setSelectedCoupon(null);
    setDiscountedAmount(null);
    toast.info("Coupon removed.");
  };

  const toggleCouponDropdown = () => setIsCouponDropdownOpen((p) => !p);

  // ------------------------------------------------------------------------
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Checkout Summary</h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full" />
          <span className="ml-3 text-gray-600">Loading cart...</span>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">Cart</div>
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-6">Browse courses to get started!</p>
          <button
            onClick={() => navigate("/user/courses")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <>
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full mr-3" />
                <div className="text-blue-800">
                  <div className="font-medium">Processing</div>
                  <div className="text-sm">Do not refresh or close.</div>
                </div>
              </div>
            </div>
          )}

          {pendingOrderId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">Warning</div>
                  <div className="text-yellow-800">
                    <div className="font-medium">Pending Order</div>
                    <div className="text-sm">Cancel to start new payment.</div>
                  </div>
                </div>
                <button
                  onClick={handleCancelPendingOrder}
                  disabled={isCancelProcessing}
                  className={`px-4 py-2 rounded-lg ${
                    isCancelProcessing
                      ? "bg-gray-300 text-gray-500"
                      : "bg-yellow-600 hover:bg-yellow-700 text-white"
                  }`}
                >
                  {isCancelProcessing ? "Cancelling..." : "Cancel"}
                </button>
              </div>
            </div>
          )}

          {/* -------------------------- Cart Table -------------------------- */}
          <div className="bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase">
                    Item
                  </th>
                  <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-20 h-14 object-cover rounded-lg"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {item.title} ({item.type === "course" ? "Course" : "Path"})
                          </div>

                          {item.isAlreadyEnrolled && item.type === "course" && (
                            <div className="text-xs text-green-600">Already enrolled</div>
                          )}

                          {/* Fixed: Safe access to enrolledCourses */}
                          {item.type === "learningPath" &&
                            (item.enrolledCourses?.length ?? 0) > 0 && (
                              <div className="text-xs text-green-600">
                                Some courses enrolled
                              </div>
                            )}

                          {item.type === "learningPath" && item.price === 0 && (
                            <div className="text-xs text-yellow-600">Remove this path</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="text-lg font-semibold">
                        ₹{item.price.toLocaleString()}
                      </div>
                      {item.isAlreadyEnrolled && (
                        <div className="text-sm text-gray-500">₹0</div>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleRemove(item._id, item.title, item.type)}
                        disabled={isProcessing}
                        className={`text-sm px-3 py-1 rounded ${
                          isProcessing
                            ? "text-gray-400 bg-gray-100"
                            : "text-red-600 hover:bg-red-50"
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
                  <td className="py-4 px-6 text-right font-medium">Total:</td>
                  <td className="py-4 px-6 text-right text-xl font-bold">
                    ₹{totalAmount.toLocaleString()}
                  </td>
                  <td />
                </tr>
                {discountedAmount !== null && (
                  <tr>
                    <td className="py-4 px-6 text-right font-medium">Final:</td>
                    <td className="py-4 px-6 text-right text-xl font-bold text-green-600">
                      ₹{discountedAmount.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {/* -------------------------- Coupon Section -------------------------- */}
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Apply Coupon</h3>
            <div
              className="cursor-pointer p-3 border rounded-lg hover:bg-gray-50"
              onClick={toggleCouponDropdown}
            >
              <div className="flex justify-between">
                <span className="font-medium">Select Coupon</span>
                <span>{isCouponDropdownOpen ? "Up" : "Down"}</span>
              </div>
            </div>

            {isCouponDropdownOpen && availableCoupons.length > 0 && (
              <div className="mt-4 space-y-2">
                {availableCoupons.map((coupon) => (
                  <div
                    key={coupon._id}
                    className="flex justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <span>
                      {coupon.code} - {coupon.discount}% (Min ₹{coupon.minPurchase})
                    </span>
                    <button
                      onClick={() => handleApplyCoupon(coupon)}
                      disabled={selectedCoupon?.code === coupon.code}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedCoupon?.code === coupon.code
                          ? "bg-gray-300 text-gray-500"
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
              <div className="mt-4 flex justify-between text-green-600 font-medium">
                <span>
                  Coupon {selectedCoupon.code} applied! Final: ₹
                  {discountedAmount?.toLocaleString()}
                </span>
                <button onClick={handleRemoveCoupon} className="text-red-600 text-sm">
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* -------------------------- Wallet -------------------------- */}
          {wallet && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">Wallet</div>
                  <div>
                    <div className="font-medium text-blue-900">Wallet Balance</div>
                    <div className="text-sm text-blue-700">Instant payment</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-900">
                    ₹{wallet.balance.toLocaleString()}
                  </div>
                  {!canProceedWithWallet && (
                    <div className="text-xs text-red-600">Insufficient</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------- Payment Method -------------------------- */}
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Payment Method</h3>
            <div className="space-y-3">
              <label
                className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                  paymentMethod === "razorpay"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                } ${isProcessing ? "opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                  disabled={isProcessing}
                  className="mr-3"
                />
                <div className="flex items-center">
                  <div className="text-2xl mr-3">Credit Card</div>
                  <div>
                    <div className="font-medium">Razorpay</div>
                    <div className="text-sm text-gray-600">Card, UPI, Net Banking</div>
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                  paymentMethod === "wallet"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                } ${isProcessing || !canProceedWithWallet ? "opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  value="wallet"
                  checked={paymentMethod === "wallet"}
                  onChange={() => setPaymentMethod("wallet")}
                  disabled={isProcessing || !canProceedWithWallet}
                  className="mr-3"
                />
                <div className="flex items-center">
                  <div className="text-2xl mr-3">Wallet</div>
                  <div>
                    <div className="font-medium">Wallet Payment</div>
                    <div className="text-sm text-gray-600">
                      {canProceedWithWallet ? "Instant" : "Insufficient balance"}
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* -------------------------- Pay Buttons -------------------------- */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={handlePayment}
              disabled={
                isProcessing ||
                paymentMethod !== "wallet" ||
                !canProceedWithWallet ||
                !!pendingOrderId
              }
              className={`flex-1 py-3 rounded-lg flex items-center justify-center ${
                isProcessing ||
                paymentMethod !== "wallet" ||
                !canProceedWithWallet ||
                !!pendingOrderId
                  ? "bg-gray-300 text-gray-500"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isWalletProcessing
                ? "Processing..."
                : `Pay via Wallet (₹${(
                    discountedAmount || totalAmount
                  ).toLocaleString()})`}
            </button>

            <button
              onClick={handlePayment}
              disabled={isProcessing || paymentMethod !== "razorpay" || !!pendingOrderId}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center ${
                isProcessing || paymentMethod !== "razorpay" || !!pendingOrderId
                  ? "bg-gray-300 text-gray-500"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isRazorpayProcessing
                ? "Processing..."
                : `Pay via Razorpay (₹${(
                    discountedAmount || totalAmount
                  ).toLocaleString()})`}
            </button>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => navigate("/user/cart")}
              disabled={isProcessing}
              className={`font-medium ${
                isProcessing ? "text-gray-400" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Back to Cart
            </button>

            <button
              onClick={handlePayment}
              disabled={
                isProcessing ||
                cartItems.length === 0 ||
                (paymentMethod === "wallet" && !canProceedWithWallet) ||
                !!pendingOrderId
              }
              className={`px-8 py-3 rounded-lg font-medium flex items-center ${
                isProcessing ||
                cartItems.length === 0 ||
                (paymentMethod === "wallet" && !canProceedWithWallet) ||
                !!pendingOrderId
                  ? "bg-gray-300 text-gray-500"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isProcessing
                ? "Processing..."
                : `Pay ₹${(discountedAmount || totalAmount).toLocaleString()}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutPage;