import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { bookingDetail, slotReceipt } from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import fileDownload from "js-file-download";

interface User {
  username?: string;
  email?: string;
}

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
}

interface Booking {
  _id: string;
  amount?: number;
  status: string;
  createdAt: string;
  txnId?: string;
  gateway?: string;
  slotId?: Slot;
  instructorId?: User;
  studentId?: User;
}

export default function SlotBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await bookingDetail(bookingId!);
        setBooking(res.data);
      } catch (error) {
        toast.error("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) fetchBooking();
  }, [bookingId]);

  const handleDownloadReceipt = async () => {
    if (!bookingId) return;
    try {
      const response = await slotReceipt(bookingId);
      fileDownload(response, `Slot-Receipt-${bookingId}.pdf`);
    } catch (error) {
      toast.error("Failed to download receipt");
    }
  };

  const formatDateTimeRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })} - ${endDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "paid":
      case "confirmed":
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
  if (!booking) return <div className="text-center py-20 text-red-500">Booking not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Booking Details</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Booked on {booking.createdAt ? formatDate(booking.createdAt) : "N/A"}
              </p>
            </div>

            {/* Download Button */}
            <div>
              <button
                onClick={handleDownloadReceipt}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md transition duration-200"
              >
                Download Receipt
              </button>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Student Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Student</h3>
            <p className="text-gray-700 font-medium">{booking.studentId?.username || "N/A"}</p>
            <p className="text-gray-600 text-sm">{booking.studentId?.email || "N/A"}</p>
          </div>

          {/* Instructor Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Instructor</h3>
            <p className="text-gray-700 font-medium">{booking.instructorId?.username || "N/A"}</p>
            <p className="text-gray-600 text-sm">{booking.instructorId?.email || "N/A"}</p>
          </div>

          {/* Status Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Status</h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                booking.status
              )}`}
            >
              {booking.status}
            </span>
            <p className="text-sm text-gray-600 mt-1">Booking ID: {booking._id}</p>
          </div>
        </div>

        {/* Slot Info */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Slot Information</h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Date</p>
                <p className="text-gray-800 font-medium">
                  {booking.slotId?.startTime
                    ? new Date(booking.slotId.startTime).toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Time</p>
                <p className="text-gray-800 font-medium">
                  {booking.slotId?.startTime && booking.slotId?.endTime
                    ? formatDateTimeRange(booking.slotId.startTime, booking.slotId.endTime)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Transaction ID</p>
                <p className="text-gray-800 font-medium">{booking.txnId || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-600">Amount</p>
                <p className="text-gray-800 font-bold text-xl">
                  ₹
                  {booking.slotId?.price !== undefined
                    ? booking.slotId.price.toLocaleString()
                    : "0"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
