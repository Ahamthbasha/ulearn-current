import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  orderDetail,
  downloadInvoice,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";

interface Course {
  courseName: string;
  thumbnailUrl: string;
  price: number;
}

interface Order {
  customerName: string;
  customerEmail: string;
  payment: string;
  totalAmount: number;
  status: string;
  orderId: string;
  orderDate: string;
  courses: Course[];
}

export default function StudentOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderDetail(orderId!);
        setOrder(res.order);
      } catch (error) {
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  const handleDownloadInvoice = async () => {
    try {
      await downloadInvoice(orderId!);
    } catch (error) {
      toast.error("Failed to download invoice");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!order)
    return (
      <div className="text-center py-20 text-red-500">Order not found.</div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Order Details
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Order placed on {order.orderDate}
              </p>
            </div>
            <button
              onClick={handleDownloadInvoice}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11v6m0 0l-3-3m3 3l3-3m6 3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Download Invoice
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Customer
            </h3>
            <p className="text-gray-700 font-medium">
              {order.customerName || "N/A"}
            </p>
            <p className="text-gray-600 text-sm">
              {order.customerEmail || "N/A"}
            </p>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Payment
            </h3>
            <p className="text-gray-700 font-medium capitalize">
              {order.payment}
            </p>
            <p className="text-2xl font-bold text-gray-800">
              ₹{order.totalAmount.toLocaleString()}
            </p>
          </div>

          {/* Status Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Status</h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>
            <p className="text-sm text-gray-600 mt-1">
              Order ID: {order.orderId}
            </p>
          </div>
        </div>

        {/* Courses List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">
              Purchased Courses
            </h3>
          </div>

          {/* Table for desktop */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Course
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.courses.map((course, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6 flex items-center gap-4">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.courseName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {course.courseName}
                        </h4>
                        <p className="text-sm text-gray-600">Digital Course</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-gray-800">
                      ₹{course.price.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {order.courses.map((course, idx) => (
              <div key={idx} className="p-4 flex gap-4 items-center">
                <img
                  src={course.thumbnailUrl}
                  alt={course.courseName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">
                    {course.courseName}
                  </h4>
                  <p className="text-sm text-gray-600">Digital Course</p>
                  <p className="text-lg font-semibold text-gray-800">
                    ₹{course.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Total Section */}
          <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-700">
              Total Amount:
            </span>
            <span className="text-2xl font-bold text-gray-800">
              ₹{order.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
