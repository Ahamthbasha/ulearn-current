import React, { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
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

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        if (!planId) throw new Error("Plan ID not provided");

        const data = await membershipInitiateCheckout(planId);
        setOrderData(data);

        const walletData = await instructorGetWallet();
        if (walletData?.wallet?.balance != null) {
          setWalletBalance(walletData.wallet.balance);
        } else {
          setWalletBalance(0);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load checkout or wallet data");
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [planId]);

  const handlePayment = () => {
    if (!orderData) return;

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
          });

          toast.success("Membership activated successfully!");
          navigate("/instructor/slots");
        } catch (err) {
          console.error(err);
          toast.error("Payment verification failed");
        }
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
    razorpay.open();
  };

  const handleWalletPurchase = async () => {
    try {
      if (!planId) return;

      setIsProcessing(true);
      await purchaseMembershipWithWallet(planId);
      toast.success("Membership activated using wallet!");
      navigate("/instructor/slots");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Wallet payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="text-center mt-10">Loading checkout...</div>;
  if (!orderData) return <div className="text-center mt-10 text-red-500">Failed to load order.</div>;

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg mt-10 shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Membership Checkout</h2>
      <p className="mb-2"><strong>Plan Name:</strong> {orderData.planName}</p>
      <p className="mb-2"><strong>Duration:</strong> {orderData.durationInDays} days</p>
      <p className="mb-2"><strong>Price:</strong> ₹{orderData.amount}</p>

      {walletBalance !== null && (
        <p className="mb-2">
          <strong>Your Wallet Balance:</strong>{" "}
          <span className={walletBalance < orderData.amount ? "text-red-500" : "text-green-600"}>
            ₹{walletBalance}
          </span>
        </p>
      )}

      {orderData.description && (
        <p className="mt-3 text-sm text-gray-600">{orderData.description}</p>
      )}

      {orderData.benefits && orderData.benefits.length > 0 && (
        <ul className="mt-4 space-y-2">
          {orderData.benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="text-green-500 w-4 h-4" />
              {benefit}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 mt-6">
        <button
          onClick={handlePayment}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Pay with Razorpay
        </button>

        <button
          onClick={handleWalletPurchase}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
          disabled={isProcessing || (walletBalance !== null && walletBalance < orderData.amount)}
        >
          {isProcessing
            ? "Processing..."
            : walletBalance !== null && walletBalance < orderData.amount
            ? "Insufficient Wallet Balance"
            : "Pay with Wallet"}
        </button>
      </div>
    </div>
  );
};

export default MembershipCheckoutPage;
