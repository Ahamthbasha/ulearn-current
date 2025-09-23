import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  slotCheckout,
  verifySlotPayment,
  getWallet,
  bookSlotViaWallet,
  checkSlotAvailabilityApi,
  cancelPendingBookingApi,
  handlePaymentFailureApi,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { format } from "date-fns";

const SlotCheckoutPage = () => {
  const { slotId } = useParams();
  const navigate = useNavigate();

  const [availability, setAvailability] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<string | undefined>(undefined);
  const razorpayInstanceRef = useRef<any>(null);
  const hasNavigatedRef = useRef<boolean>(false);
  const currentBookingIdRef = useRef<string | undefined>(undefined); // Store current booking ID

  const isProcessing = isRazorpayProcessing || isWalletProcessing;

  const loadAvailability = async () => {
    if (!slotId) return;
    try {
      setLoading(true);
      const res = await checkSlotAvailabilityApi(slotId);
      setAvailability(res);
      if (res.reason === "PENDING_BOOKING_EXISTS") {
        setPendingBookingId(res.bookingId);
        setShowCancelDialog(true);
      }
    } catch (err: any) {
      console.error("Availability check error:", err);
      toast.error(err.response?.data?.message || "Failed to load slot details.");
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        navigate("/user/slotsHistory");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!slotId) return;

    const init = async () => {
      try {
        const walletRes = await getWallet();
        setWalletBalance(walletRes.wallet?.balance || 0);

        await loadAvailability();
      } catch (err: any) {
        console.error("Init error:", err);
        toast.error("Failed to initialize checkout.");
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          navigate("/user/slotsHistory");
        }
      }
    };

    init();

    return () => {
      if (razorpayInstanceRef.current) {
        try {
          razorpayInstanceRef.current.close();
        } catch (e) {}
      }
    };
  }, [slotId]);

  const handleCancelPending = async () => {
    if (!pendingBookingId) return;
    try {
      await cancelPendingBookingApi(pendingBookingId);
      toast.success("Pending booking cancelled.");
      setShowCancelDialog(false);
      setPendingBookingId(undefined);
      currentBookingIdRef.current = undefined;
      await loadAvailability();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel pending booking.");
    }
  };

  const handlePaymentFailure = async (bookingId: string) => {
    try {
      console.log("Handling payment failure for booking:", bookingId);
      await handlePaymentFailureApi(bookingId);
      toast.error("Payment failed. Booking has been cancelled.");
    } catch (err: any) {
      console.error("Error handling payment failure:", err);
      toast.error("Payment failed but couldn't update booking status.");
    } finally {
      setIsRazorpayProcessing(false);
      setPendingBookingId(undefined);
      currentBookingIdRef.current = undefined;
      
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        navigate("/user/slotsHistory", { replace: true });
      }
    }
  };

  const handleRazorpayPayment = async () => {
    if (isProcessing || !availability?.slot) {
      toast.warn("Payment is already being processed or slot not available.");
      return;
    }

    setIsRazorpayProcessing(true);

    try {
      const res = await slotCheckout(slotId!);
      const { razorpayOrder, booking } = res;

      if (!razorpayOrder || !booking?.bookingId) {
        throw new Error("Failed to create order or booking");
      }

      const bookingId = booking.bookingId;
      setPendingBookingId(bookingId);
      currentBookingIdRef.current = bookingId; // Store in ref for event handlers

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "uLearn Slot Booking",
        description: "Session with Instructor",
        order_id: razorpayOrder.id,
        handler: async function ({ razorpay_payment_id }: { razorpay_payment_id: string }) {
          try {
            console.log("Payment successful, verifying...");
            await verifySlotPayment(slotId!, razorpay_payment_id);
            toast.success("✅ Slot booked successfully!");
            if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              navigate("/user/slotsHistory");
            }
          } catch (err: any) {
            console.error("Payment verification failed:", err);
            const errorMessage = err?.response?.data?.message || "❌ Payment verification failed";
            toast.error(errorMessage);
            
            // Handle payment verification failure
            if (currentBookingIdRef.current) {
              await handlePaymentFailure(currentBookingIdRef.current);
            } else if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              navigate("/user/slotsHistory");
            }
          } finally {
            setIsRazorpayProcessing(false);
            setPendingBookingId(undefined);
            currentBookingIdRef.current = undefined;
          }
        },
        modal: {
          ondismiss: async () => {
            console.log("Payment modal dismissed");
            // Handle modal dismissal as payment failure
            if (currentBookingIdRef.current && !hasNavigatedRef.current) {
              await handlePaymentFailure(currentBookingIdRef.current);
            } else {
              setIsRazorpayProcessing(false);
              setPendingBookingId(undefined);
              currentBookingIdRef.current = undefined;
            }
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
      
      // Handle payment failure event
      rzp.on('payment.failed', async (response: any) => {
        console.log("Payment failed event triggered:", response);
        
        if (currentBookingIdRef.current) {
          await handlePaymentFailure(currentBookingIdRef.current);
        } else {
          console.error("No booking ID available for payment failure handling");
          setIsRazorpayProcessing(false);
          toast.error("Payment failed.");
          if (!hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            navigate("/user/slotsHistory", { replace: true });
          }
        }
      });

      rzp.open();
    } catch (err: any) {
      console.error("Razorpay initiation error:", err);
      const error = err.response?.data;
      if (error?.error === "PENDING_BOOKING_EXISTS") {
        setPendingBookingId(error.bookingId);
        currentBookingIdRef.current = error.bookingId;
        setShowCancelDialog(true);
      } else if (error?.error === "PENDING_BOOKING_BY_OTHERS") {
        toast.error(error.message);
      } else {
        toast.error(error?.message || "Failed to initiate payment.");
      }
      setIsRazorpayProcessing(false);
      currentBookingIdRef.current = undefined;
    }
  };

  const handleWalletPayment = async () => {
    if (isProcessing || !availability?.slot) {
      toast.warn("Payment is already being processed or slot not available.");
      return;
    }

    const slotPrice = availability.slot?.price || 0;
    if (walletBalance < slotPrice) {
      toast.error("❌ Insufficient wallet balance.");
      return;
    }

    setIsWalletProcessing(true);

    try {
      await bookSlotViaWallet(slotId!);
      toast.success("✅ Slot booked using wallet!");
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        navigate("/user/slotsHistory");
      }
    } catch (err: any) {
      console.error("Wallet payment error:", err);
      const error = err.response?.data;
      if (error?.error === "PENDING_BOOKING_EXISTS") {
        setPendingBookingId(error.bookingId);
        setShowCancelDialog(true);
      } else if (error?.error === "PENDING_BOOKING_BY_OTHERS") {
        toast.error(error.message);
      } else {
        toast.error(error?.message || "❌ Wallet booking failed");
      }
    } finally {
      setIsWalletProcessing(false);
    }
  };

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

  if (!availability?.available) {
    let message = availability?.message || "Slot not available.";
    if (availability.reason === "PENDING_BOOKING_BY_OTHERS") {
      message = "This slot is being processed by another user. Please try again later.";
    } else if (availability.reason === "SLOT_ALREADY_BOOKED") {
      message = "This slot has already been booked.";
    } else if (availability.reason === "SLOT_NOT_FOUND") {
      message = "Slot not found.";
    }

    return (
      <div className="min-h-screen bg-white py-10 px-6 md:px-20">
        <div className="max-w-2xl mx-auto shadow-lg border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-6">Slot Unavailable</h2>
          <p className="text-red-500 mb-4">{message}</p>
          {availability.reason === "PENDING_BOOKING_EXISTS" && pendingBookingId && (
            <button
              onClick={handleCancelPending}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors mb-4"
            >
              Cancel Pending Booking
            </button>
          )}
          <button
            onClick={() => {
              if (!hasNavigatedRef.current) {
                hasNavigatedRef.current = true;
                navigate("/user/slotsHistory");
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Slots
          </button>
        </div>
      </div>
    );
  }

  const slot = availability?.slot || {};
  const instructor = slot.instructorId || {};
  const slotPrice = slot?.price || 0;

  return (
    <div className="min-h-screen bg-white py-10 px-6 md:px-20">
      <div className="max-w-2xl mx-auto shadow-lg border rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Confirm Your Slot Booking
        </h2>

        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <div className="text-blue-800">
                <div className="font-medium">Payment Processing</div>
                <div className="text-sm">Please don't refresh or close this tab.</div>
              </div>
            </div>
          </div>
        )}

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
              disabled={isProcessing || walletBalance < slotPrice}
              className={`px-6 py-2 rounded-lg transition flex items-center justify-center ${
                isProcessing || walletBalance < slotPrice
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
              disabled={isProcessing}
              className={`px-6 py-2 rounded-lg transition flex items-center justify-center ${
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
                `💳 Pay via Razorpay (₹${slotPrice})`
              )}
            </button>
          </div>

          {pendingBookingId && (
            <button
              onClick={handleCancelPending}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors w-full"
            >
              Cancel Pending Booking
            </button>
          )}

          <div className="flex justify-center mt-6">
            <button
              onClick={() => {
                if (!hasNavigatedRef.current) {
                  hasNavigatedRef.current = true;
                  navigate("/user/slotsHistory");
                }
              }}
              disabled={isProcessing}
              className={`font-medium transition-colors ${
                isProcessing
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              ← Back to Slots
            </button>
          </div>
        </div>

        {showCancelDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold mb-4">Pending Booking Detected</h3>
              <p className="mb-4">You have a pending booking for this slot. Would you like to cancel it and start a new payment?</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleCancelPending}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotCheckoutPage;