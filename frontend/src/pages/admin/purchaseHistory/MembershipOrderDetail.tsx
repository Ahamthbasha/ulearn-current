import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMembershipPurchaseHistoryDetail } from "../../../api/action/AdminActionApi";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { type MembershipOrder } from "../interface/adminInterface";
import { AxiosError } from "axios";

const MembershipOrderDetail: React.FC = () => {
  const { txnId } = useParams<{ txnId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<MembershipOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const response = await getMembershipPurchaseHistoryDetail(txnId!);
      setOrder(response.data);
    } catch (err: unknown) {
      if(err instanceof AxiosError){
        toast.error(err.response?.data?.message || "Failed to load order detail");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [txnId]);

  return (
    <div className="min-h-screen p-4 lg:p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center text-blue-600 hover:underline"
        >
          <ArrowLeft className="mr-1" size={18} />
          Back
        </button>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">
            Membership Order Details
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : order ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              {/* Instructor */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Instructor</h3>
                <p>{order.instructor.name}</p>
                <p className="text-gray-500">{order.instructor.email}</p>
              </div>

              {/* Plan */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Plan</h3>
                <p>{order.membershipPlan.name}</p>
                <p className="text-gray-500">
                  {order.membershipPlan.durationInDays} days
                </p>
                <p className="mt-1 text-gray-600 italic">
                  {order.membershipPlan.description}
                </p>
                {order.membershipPlan.benefits.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-gray-600">
                    {order.membershipPlan.benefits.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Price */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Price</h3>
                <p>₹{order.price}</p>
              </div>

              {/* Payment Status */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Payment Status
                </h3>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    order.paymentStatus === "paid"
                      ? "bg-green-100 text-green-600"
                      : order.paymentStatus === "failed"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              {/* Start Date */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Start Date</h3>
                <p>{new Date(order.startDate).toLocaleDateString()}</p>
              </div>

              {/* End Date */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">End Date</h3>
                <p>{new Date(order.endDate).toLocaleDateString()}</p>
              </div>

              {/* Transaction ID */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Transaction ID
                </h3>
                <p>{order.razorpayOrderId}</p>
              </div>

              {/* Created At */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Created At</h3>
                <p>
  {new Date(order.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}
</p>

              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No order data found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembershipOrderDetail;
