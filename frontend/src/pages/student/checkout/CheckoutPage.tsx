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
import type {
  ApiError,
  RazorpayInstance,
  RazorpayOptions,
  RazorpayResponse,
} from "../../../types/interfaces/ICommon";

const CheckoutPage = () => {
  const [cartItems, setCartItems] = useState<checkoutCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet>({ balance: 0 });
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "wallet">(
    "razorpay"
  );
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

  const isProcessing =
    isRazorpayProcessing || isWalletProcessing || isCancelProcessing;

  useEffect(() => {
    fetchCartItems();
    fetchWalletBalance();
    fetchAvailableCoupons();

    return () => {
      if (razorpayInstanceRef.current?.close) {
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

        if (
          cartItem.type === "learningPath" &&
          (cartItem.enrolledCourses?.length ?? 0) > 0
        ) {
          toast.info(
            `Some courses in "${cartItem.title}" are already enrolled and will not be charged.`,
            { autoClose: 5000 }
          );
        }

        validItems.push(cartItem);
      }

      if (errors.length) errors.forEach((msg) => toast.error(msg));
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

    if (res?.wallet === null) {
      setWallet({ balance: 0 });
      return;
    }


    if (!res?.wallet || typeof res.wallet.balance !== "number") {
      throw new Error("Invalid wallet data");
    }
    setWallet({ balance: res.wallet.balance });
  } catch (error) {
    toast.error("Failed to fetch wallet balance");
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
    } catch {
      toast.error("Failed to fetch coupons.");
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => {
    if (item.isAlreadyEnrolled && item.type === "course") return sum;
    return sum + item.price;
  }, 0);

  const getBackendErrorMessage = (error: unknown): string => {
    const apiError = error as ApiError;
    return (
      apiError?.response?.data?.message ||
      apiError?.response?.data?.error ||
      apiError?.message ||
      "An unexpected error occurred"
    );
  };

  const handleBackendError = (
    error: unknown,
    paymentType: "razorpay" | "wallet"
  ) => {
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
      toast.error(
        "A payment is already in progress. Cancel it to proceed with a new payment."
      );
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
      const courseIds = cartItems
        .filter((i) => i.type === "course")
        .map((i) => i._id);
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
            if (!razorpayResponse.razorpay_payment_id)
              throw new Error("Payment ID missing");
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
        theme: { color: "#2563eb" },
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
      wallet.balance < (discountedAmount || totalAmount)
    ) {
      toast.error("Insufficient balance. Please use Razorpay.");
      return;
    }

    setIsWalletProcessing(true);
    try {
      const courseIds = cartItems
        .filter((i) => i.type === "course")
        .map((i) => i._id);
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

  const handlePayment = debounce(() => {
    paymentMethod === "razorpay"
      ? handleRazorpayPayment()
      : handleWalletPayment();
  }, 800);

  const handleRemove = async (
    itemId: string,
    title: string,
    type: "course" | "learningPath"
  ) => {
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

  const canProceedWithWallet =
    wallet.balance >= (discountedAmount || totalAmount);

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

  const toggleCouponDropdown = () =>
    setIsCouponDropdownOpen((p) => !p);

  const finalAmount = discountedAmount ?? totalAmount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
          Checkout Summary
        </h2>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <svg
              className="animate-spin h-12 w-12 text-blue-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <span className="ml-3 text-lg text-gray-600">Loading cart...</span>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-20 bg-white rounded-xl shadow-lg">
            <div className="text-7xl mb-4 text-gray-300">Cart</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-600 mb-6">
              Browse courses to get started!
            </p>
            <button
              onClick={() => navigate("/user/courses")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <>
            {/* Processing Banner */}
            {isProcessing && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex items-center">
                  <svg
                    className="animate-spin h-6 w-6 text-blue-600 mr-3"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  <div className="text-blue-800">
                    <p className="font-semibold">Processing</p>
                    <p className="text-sm">Do not refresh or close.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Order Banner */}
            {pendingOrderId && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg
                      className="h-6 w-6 text-yellow-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="text-yellow-800">
                      <p className="font-semibold">Pending Order</p>
                      <p className="text-sm">Cancel to start a new payment.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelPendingOrder}
                    disabled={isCancelProcessing}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      isCancelProcessing
                        ? "bg-gray-300 text-gray-600"
                        : "bg-yellow-600 hover:bg-yellow-700 text-white"
                    }`}
                  >
                    {isCancelProcessing ? "Cancelling..." : "Cancel"}
                  </button>
                </div>
              </div>
            )}

            {/* Cart Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-semibold">
                      Item
                    </th>
                    <th className="py-4 px-6 text-right text-sm font-semibold">
                      Price
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="py-5 px-6">
                        <div className="flex items-center space-x-4">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-20 h-14 object-cover rounded-lg shadow-sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {item.title}{" "}
                              <span className="text-xs text-gray-500">
                                ({item.type === "course" ? "Course" : "Path"})
                              </span>
                            </p>

                            {item.isAlreadyEnrolled && item.type === "course" && (
                              <p className="text-xs text-green-600 mt-1">
                                Already enrolled
                              </p>
                            )}

                            {item.type === "learningPath" &&
                              (item.enrolledCourses?.length ?? 0) > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                  Some courses enrolled
                                </p>
                              )}

                            {item.type === "learningPath" && item.price === 0 && (
                              <p className="text-xs text-yellow-600 mt-1">
                                Remove this path
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-5 px-6 text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ₹{item.price.toLocaleString()}
                        </p>
                        {item.isAlreadyEnrolled && (
                          <p className="text-sm text-gray-500">₹0</p>
                        )}
                      </td>

                      <td className="py-5 px-6 text-center">
                        <button
                          onClick={() =>
                            handleRemove(item._id, item.title, item.type)
                          }
                          disabled={isProcessing}
                          className={`text-sm px-3 py-1 rounded transition ${
                            isProcessing
                              ? "text-gray-400 bg-gray-100 cursor-not-allowed"
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
                    <td className="py-4 px-6 text-right font-medium text-gray-700">
                      Total:
                    </td>
                    <td className="py-4 px-6 text-right text-xl font-bold text-gray-900">
                      ₹{totalAmount.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                  {discountedAmount !== null && (
                    <tr>
                      <td className="py-4 px-6 text-right font-medium text-green-700">
                        Final (after coupon):
                      </td>
                      <td className="py-4 px-6 text-right text-xl font-bold text-green-600">
                        ₹{discountedAmount.toLocaleString()}
                      </td>
                      <td />
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            {/* Coupon Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Apply Coupon
              </h3>

              <div
                onClick={toggleCouponDropdown}
                className="flex justify-between items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
              >
                <span className="font-medium text-gray-700">
                  {selectedCoupon ? selectedCoupon.code : "Select Coupon"}
                </span>
                <svg
                  className={`h-5 w-5 transition-transform ${
                    isCouponDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {isCouponDropdownOpen && availableCoupons.length > 0 && (
                <div className="mt-4 space-y-2">
                  {availableCoupons.map((coupon) => (
                    <div
                      key={coupon._id}
                      className="flex justify-between items-center p-3 border rounded-lg bg-gray-50"
                    >
                      <span className="text-sm">
                        <strong>{coupon.code}</strong> – {coupon.discount}% off
                        (Min ₹{coupon.minPurchase})
                      </span>
                      <button
                        onClick={() => handleApplyCoupon(coupon)}
                        disabled={selectedCoupon?.code === coupon.code}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${
                          selectedCoupon?.code === coupon.code
                            ? "bg-gray-300 text-gray-600"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {selectedCoupon?.code === coupon.code
                          ? "Applied"
                          : "Apply"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedCoupon && (
                <div className="mt-4 flex justify-between items-center text-green-600 font-medium">
                  <span>
                    Coupon <strong>{selectedCoupon.code}</strong> applied! Final
                    ₹{discountedAmount?.toLocaleString()}
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-6 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <div>
                    <p className="text-lg font-semibold">Wallet Balance</p>
                    <p className="text-sm opacity-90">Instant payment</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    ₹{wallet.balance.toLocaleString()}
                  </p>
                  {!canProceedWithWallet && (
                    <p className="text-xs mt-1 opacity-80">Insufficient</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Payment Method
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Razorpay */}
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                    paymentMethod === "razorpay"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:bg-gray-50"
                  } ${isProcessing ? "opacity-60" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")}
                    disabled={isProcessing}
                    className="mr-3"
                  />
                  <div className="flex items-center space-x-3">
                    <svg
                      className="h-8 w-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-6 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">Razorpay</p>
                      <p className="text-sm text-gray-600">
                        Card, UPI, Net Banking
                      </p>
                    </div>
                  </div>
                </label>

                {/* Wallet */}
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                    paymentMethod === "wallet"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-300 hover:bg-gray-50"
                  } ${
                    isProcessing || !canProceedWithWallet ? "opacity-60" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="wallet"
                    checked={paymentMethod === "wallet"}
                    onChange={() => setPaymentMethod("wallet")}
                    disabled={isProcessing || !canProceedWithWallet}
                    className="mr-3"
                  />
                  <div className="flex items-center space-x-3">
                    <svg
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-6 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">Wallet Payment</p>
                      <p className="text-sm text-gray-600">
                        {canProceedWithWallet
                          ? "Instant"
                          : "Insufficient balance"}
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Buttons (only two) */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Wallet Button */}
              <button
                onClick={handlePayment}
                disabled={
                  isProcessing ||
                  paymentMethod !== "wallet" ||
                  !canProceedWithWallet ||
                  !!pendingOrderId
                }
                className={`py-4 rounded-lg font-semibold flex items-center justify-center transition ${
                  isProcessing ||
                  paymentMethod !== "wallet" ||
                  !canProceedWithWallet ||
                  !!pendingOrderId
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isWalletProcessing
                  ? "Processing..."
                  : `Pay via Wallet (₹${finalAmount.toLocaleString()})`}
              </button>

              {/* Razorpay Button */}
              <button
                onClick={handlePayment}
                disabled={
                  isProcessing ||
                  paymentMethod !== "razorpay" ||
                  !!pendingOrderId
                }
                className={`py-4 rounded-lg font-semibold flex items-center justify-center transition ${
                  isProcessing ||
                  paymentMethod !== "razorpay" ||
                  !!pendingOrderId
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isRazorpayProcessing
                  ? "Processing..."
                  : `Pay via Razorpay (₹${finalAmount.toLocaleString()})`}
              </button>
            </div>

            {/* Bottom Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate("/user/cart")}
                disabled={isProcessing}
                className={`font-medium transition ${
                  isProcessing
                    ? "text-gray-400"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Back to Cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;