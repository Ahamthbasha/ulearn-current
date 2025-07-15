import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!slotId) return;

    const init = async () => {
      try {
        // Fetch wallet balance
        const walletRes = await getWallet();
        setWalletBalance(walletRes.wallet?.balance || 0);

        // Initiate slot checkout
        const { booking, razorpayOrder } = await slotCheckout(slotId);
        setBooking(booking);
        setOrder(razorpayOrder);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to initiate booking");
        navigate("/student/slots");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [slotId]);

  const handleRazorpayPayment = () => {
    if (!order || !booking) return toast.error("Booking not ready");

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
      amount: order.amount,
      currency: order.currency,
      name: "uLearn Slot Booking",
      description: "Session with Instructor",
      order_id: order.id,
      handler: async function (response: any) {
        try {
          await verifySlotPayment(booking._id, response.razorpay_payment_id, "paid");
          toast.success("Slot booked successfully!");
          navigate("/student/slot-history");
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Payment verification failed");
        }
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
    rzp.open();
  };

  const handleWalletPayment = async () => {
  const slotPrice = booking?.slotId?.price || 0;

  if (walletBalance < slotPrice) {
    toast.error("❌ Insufficient wallet balance. Please use Razorpay or recharge your wallet.");
    return;
  }

  try {
    await bookSlotViaWallet(slotId!);
    toast.success("✅ Slot booked using wallet!");
    navigate("/student/slot-history");
  } catch (err: any) {
    toast.error(err.response?.data?.message || "❌ Wallet booking failed");
  }
};


  const slotPrice = booking?.slotId?.price || 0;

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-white py-10 px-6 md:px-20">
      <div className="max-w-2xl mx-auto shadow-lg border rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Confirm Your Slot Booking</h2>

        {booking && booking.slotId ? (
          <div className="space-y-4">
            <p>
              <strong>Date:</strong>{" "}
              {format(new Date(booking.slotId.startTime), "dd-MM-yyyy")}
            </p>
            <p>
              <strong>Time:</strong>{" "}
              {`${format(new Date(booking.slotId.startTime), "h:mm a")} - ${format(
                new Date(booking.slotId.endTime),
                "h:mm a"
              )}`}
            </p>
            <p>
              <strong>Instructor:</strong> {booking.instructorId?.username || "N/A"}
            </p>
            <p>
              <strong>Price:</strong> ₹{slotPrice}
            </p>
            <p>
              <strong>Your Wallet Balance:</strong>{" "}
              <span className={walletBalance >= slotPrice ? "text-green-600" : "text-red-600"}>
                ₹{walletBalance}
              </span>
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={handleWalletPayment}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Pay via Wallet (₹{slotPrice})
              </button>

              <button
                onClick={handleRazorpayPayment}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Pay via Razorpay (₹{slotPrice})
              </button>
            </div>
          </div>
        ) : (
          <p className="text-red-500">Booking information not available.</p>
        )}
      </div>
    </div>
  );
};

export default SlotCheckoutPage;
