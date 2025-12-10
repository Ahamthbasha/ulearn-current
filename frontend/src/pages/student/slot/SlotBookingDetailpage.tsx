import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bookingDetail, slotReceipt, retrySlotPayment, verifyRetrySlotPayment, handlePaymentFailureApi } from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import fileDownload from "js-file-download";
import VideoCallModal from "../../../components/common/videocall/CreateCall";
import useVideoCall from "../../../components/common/videocall/UseVideoCall";
import { type ApiError, type BookingDetailDTO, type IRazorpayOrder, type IRazorpayPaymentResponse } from "../interface/studentInterface";

export default function SlotBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSlotActive, setIsSlotActive] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [markingFailed, setMarkingFailed] = useState(false);
  const navigate = useNavigate();

  // Initialize useVideoCall hook
  const { showVideoCallModal, sender, handleCall, closeModal } = useVideoCall();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await bookingDetail(bookingId!);
        setBooking(res.data);
        checkSlotActive(res.data.slotDate, res.data.startTime, res.data.endTime);
      } catch (error) {
        toast.error("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) fetchBooking();
  }, [bookingId]);

  // Updated checkSlotActive function to work with the new date/time format
  const checkSlotActive = (date: string, startTime: string, endTime: string) => {
    if (!date || !startTime || !endTime) return;

    try {
      const now = new Date();

      // Parse the date (format: "01-08-2025")
      const [day, month, year] = date.split('-').map(Number);

      // Parse time (format: "02:37 PM")
      const parseTime = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;

        if (period === 'PM' && hours !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hours === 12) {
          hour24 = 0;
        }

        return { hour: hour24, minute: minutes };
      };

      const startTimeParsed = parseTime(startTime);
      const endTimeParsed = parseTime(endTime);

      const startDateTime = new Date(year, month - 1, day, startTimeParsed.hour, startTimeParsed.minute);
      const endDateTime = new Date(year, month - 1, day, endTimeParsed.hour, endTimeParsed.minute);

      setIsSlotActive(now >= startDateTime && now <= endDateTime);
    } catch (error) {
      console.error('Error parsing slot time:', error);
      setIsSlotActive(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!bookingId) return;
    try {
      setDownloadingReceipt(true);
      const response = await slotReceipt(bookingId);
      fileDownload(response, `Slot-Receipt-${bookingId}.pdf`);
      toast.success("Receipt downloaded successfully");
    } catch (error) {
      toast.error("Failed to download receipt");
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const handleRazorpayPayment = (razorpayOrder: IRazorpayOrder, bookingId: string) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "Slot Booking",
      description: "Retry Payment for Slot Booking",
      order_id: razorpayOrder.id,
      handler: async (response:IRazorpayPaymentResponse) => {
        try {
          const verificationResponse = await verifyRetrySlotPayment(
            bookingId,
            response.razorpay_payment_id
          );

          if (verificationResponse.success) {
            toast.success("Payment successful! Your slot has been booked.");
            const updatedBooking = await bookingDetail(bookingId!);
            setBooking(updatedBooking.data);
          } else {
            toast.error("Payment verification failed");
            await handlePaymentFailureApi(bookingId!);
          }
        } catch (error) {
          const err = error as ApiError
          console.error("Payment verification error:", error);

          if (err.response?.data?.error === "SLOT_ALREADY_BOOKED") {
            toast.error("This slot has already been booked by another user.");
          } else {
            toast.error("Payment verification failed");
          }

          await handlePaymentFailureApi(bookingId!);
        }
      },
      modal: {
        ondismiss: async () => {
          toast.error("Payment cancelled");
          try {
            await handlePaymentFailureApi(bookingId!);
            const updatedBooking = await bookingDetail(bookingId!);
            setBooking(updatedBooking.data);
          } catch (error) {
            console.error("Error handling payment failure:", error);
          }
        },
      },
      theme: {
        color: "#3B82F6",
      },
    };

    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  };

  const handleRetryPayment = async () => {
    if (!bookingId || !booking) return;
    try {
      setRetryingPayment(true);
      const response = await retrySlotPayment(bookingId);

      if (response.success) {
        toast.success("Payment retry initiated successfully");
        const { razorpayOrder, booking: retryBooking } = response;
        handleRazorpayPayment(razorpayOrder, retryBooking.bookingId);
      }
    } catch (error) {
      const err = error as ApiError
      console.error("Retry payment error:", error);
      if (err.response?.data?.error === "PENDING_BOOKING_BY_OTHERS") {
        toast.error("This slot is currently being processed by another user. Please try again later.");
      } else if (err.response?.data?.error === "SLOT_ALREADY_BOOKED") {
        toast.error("This slot has already been booked.");
      } else {
        toast.error(err.response?.data?.message || "Failed to retry payment");
      }
    } finally {
      setRetryingPayment(false);
    }
  };

  const handleMarkFailed = async () => {
    if (!bookingId) return;
    try {
      setMarkingFailed(true);
      const response = await handlePaymentFailureApi(bookingId);
      if (response.success) {
        toast.success("Booking marked as failed");
        const updatedBooking = await bookingDetail(bookingId);
        setBooking(updatedBooking.data);
      } else {
        toast.error("Failed to mark booking as failed");
      }
    } catch (error) {
      const err = error as ApiError
      console.error("Mark failed error:", err);
      toast.error(err.response?.data?.message || "Failed to mark booking as failed");
    } finally {
      setMarkingFailed(false);
    }
  };

  const handleJoinCall = () => {
    if (!booking?.instructorEmail) {
      toast.error("Instructor email not available");
      return;
    }
    console.log("Join Video Call Button Clicked - Student Side");
    console.log(booking.instructorEmail);
    handleCall(booking.instructorEmail);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "paid":
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "paid":
      case "confirmed":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case "pending":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "failed":
      case "cancelled":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Loading Booking Details</h3>
            <p className="text-gray-600">Please wait while we fetch your booking information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">The booking details could not be loaded. Please check the booking ID and try again.</p>
          <button
            onClick={() => navigate('/user/slotHistory')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            {/* Back Button & Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors sm:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Booking Details</h1>
                  <p className="text-sm text-gray-500 hidden sm:block">
                    Booked on {booking.bookedDateTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Badge - Mobile */}
            <div className="sm:hidden">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(
                  booking.bookingStatus
                )}`}
              >
                {getStatusIcon(booking.bookingStatus)}
                <span className="ml-1.5">{booking.bookingStatus.toUpperCase()}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Status Badge - Desktop */}
              <div className="hidden sm:flex">
                <span
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border ${getStatusColor(
                    booking.bookingStatus
                  )}`}
                >
                  {getStatusIcon(booking.bookingStatus)}
                  <span className="ml-1.5">{booking.bookingStatus.toUpperCase()}</span>
                </span>
              </div>

              {booking.bookingStatus !== "failed" && booking.bookingStatus !== "pending" && (
                <button
                  onClick={handleDownloadReceipt}
                  disabled={downloadingReceipt}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                >
                  {downloadingReceipt ? (
                    <>
                      <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">Download Receipt</span>
                      <span className="sm:hidden">Receipt</span>
                    </>
                  )}
                </button>
              )}

              {booking.bookingStatus === "confirmed" && isSlotActive && (
                <button
                  onClick={handleJoinCall}
                  className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors animate-pulse"
                >
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Join Video Call</span>
                  <span className="sm:hidden">Join Call</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile booking date */}
          <p className="text-sm text-gray-500 mt-2 sm:hidden">
            Booked on {booking.bookedDateTime}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Active Slot Alert */}
        {booking.bookingStatus === "confirmed" && isSlotActive && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-green-800">Your Session is Live!</h3>
                <p className="text-green-700 text-sm">You can now join the video call with your instructor.</p>
              </div>
              <div className="hidden sm:block ml-4">
                <button
                  onClick={handleJoinCall}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Join Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Failed Payment Alert */}
        {booking.bookingStatus === "failed" && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-red-800">Payment Failed</h3>
                <p className="text-red-700 text-sm">Your previous payment attempt failed. You can retry the payment to book this slot.</p>
              </div>
              <div className="hidden sm:block ml-4">
                <button
                  onClick={handleRetryPayment}
                  disabled={retryingPayment}
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  {retryingPayment ? "Retrying..." : "Retry Payment"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Payment Alert */}
        {booking.bookingStatus === "pending" && (
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-yellow-800">Payment Pending</h3>
                <p className="text-yellow-700 text-sm">Your payment is pending. You can mark this booking as failed to retry the payment.</p>
              </div>
              <div className="hidden sm:block ml-4">
                <button
                  onClick={handleMarkFailed}
                  disabled={markingFailed}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  {markingFailed ? "Marking..." : "Mark as Failed"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats - Mobile Only */}
        <div className="grid grid-cols-2 gap-4 sm:hidden">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">₹{booking.price.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Amount Paid</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{booking.slotDate}</div>
            <div className="text-sm text-gray-500">Session Date</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Booking Information</h3>
                  <p className="text-blue-600 text-sm">Your booking details</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Booking ID</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-mono text-sm text-gray-900 break-all">
                    {booking.bookingId.slice(-12).toUpperCase()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Transaction ID</p>
                <p className="font-mono text-sm text-gray-800 bg-gray-50 rounded-lg p-3 break-all">{booking.txnId}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Amount Paid</p>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-green-600">₹{booking.price.toLocaleString()}</span>
                  <span className="text-sm text-gray-500 ml-2">INR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Slot Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Slot Information</h3>
                  <p className="text-green-600 text-sm">Your scheduled session</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Slot ID</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-mono text-sm text-gray-900 break-all">
                    {booking.slotId.slice(-12).toUpperCase()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Session Date</p>
                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-lg font-semibold text-gray-900">{booking.slotDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Start Time</p>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-semibold text-blue-900">{booking.startTime}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">End Time</p>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-semibold text-red-900">{booking.endTime}</p>
                  </div>
                </div>
              </div>

              {/* Slot Status Indicator */}
              {isSlotActive && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
                    <p className="text-green-700 font-medium">Slot is currently active</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Student Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
                  <p className="text-purple-600 text-sm">Your details</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Full Name</p>
                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-gray-900 font-medium">{booking.studentName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Email Address</p>
                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-900 text-sm break-all">{booking.studentEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructor Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Instructor Information</h3>
                  <p className="text-orange-600 text-sm">Your instructor's details</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Instructor Name</p>
                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-gray-900 font-medium">{booking.instructorName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Email Address</p>
                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-900 text-sm break-all">{booking.instructorEmail}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900">Booking Summary</h3>
                <p className="text-gray-600 text-sm">Complete overview of your session</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-700 font-medium">Session with {booking.instructorName}</span>
                  </div>
                  <span className="text-blue-600 font-semibold text-sm bg-white px-3 py-1 rounded-full">
                    {booking.slotDate}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">Duration: {booking.startTime} - {booking.endTime}</span>
                  </div>
                  <span className="text-green-600 font-semibold bg-white px-3 py-1 rounded-full">
                    ₹{booking.price.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-blue-200 pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-lg font-semibold text-gray-800">Total Amount Paid</span>
                    <span className="text-2xl font-bold text-green-600">₹{booking.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Booking Status</span>
                </div>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.bookingStatus)}`}>
                    {getStatusIcon(booking.bookingStatus)}
                    <span className="ml-1">{booking.bookingStatus.toUpperCase()}</span>
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span>Payment Method</span>
                </div>
                <div className="mt-1">
                  <span className="text-sm font-medium text-gray-900">Online Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="sm:hidden sticky bottom-4 z-10">
          <div className="flex gap-3 px-2">
            {booking.bookingStatus !== "failed" && (
              <button
                onClick={handleDownloadReceipt}
                disabled={downloadingReceipt}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-white border-2 border-blue-600 text-blue-600 font-medium rounded-xl shadow-lg transition-all hover:bg-blue-50 disabled:opacity-50"
              >
                {downloadingReceipt ? (
                  <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                Receipt
              </button>
            )}

            {booking.bookingStatus === "confirmed" && isSlotActive && (
              <button
                onClick={handleJoinCall}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white font-medium rounded-xl shadow-lg transition-all hover:bg-green-700 animate-pulse"
              >
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Join Call
              </button>
            )}

            {booking.bookingStatus === "failed" && (
              <button
                onClick={handleRetryPayment}
                disabled={retryingPayment}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-yellow-600 text-white font-medium rounded-xl shadow-lg transition-all hover:bg-yellow-700 disabled:opacity-50"
              >
                {retryingPayment ? (
                  <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Retry
              </button>
            )}

            {booking.bookingStatus === "pending" && (
              <button
                onClick={handleMarkFailed}
                disabled={markingFailed}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-red-600 text-white font-medium rounded-xl shadow-lg transition-all hover:bg-red-700 disabled:opacity-50"
              >
                {markingFailed ? (
                  <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                Mark Failed
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Video Call Modal */}
      {showVideoCallModal && (
        <VideoCallModal
          to={sender}
          isOpen={showVideoCallModal}
          onClose={closeModal}
        />
      )}
    </div>
  );
}