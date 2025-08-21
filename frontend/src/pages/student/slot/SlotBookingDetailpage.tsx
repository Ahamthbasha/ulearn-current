import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { bookingDetail, slotReceipt } from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import fileDownload from "js-file-download";
import VideoCallModal from "../../../components/common/videocall/CreateCall";
import useVideoCall from "../../../components/common/videocall/UseVideoCall";

interface BookingDetailDTO {
  studentName: string;
  studentEmail: string;
  instructorName: string;
  instructorEmail: string;
  bookingStatus: string;
  bookingId: string;
  bookedDateTime: string;
  slotId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  price: number;
  txnId: string;
}

export default function SlotBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSlotActive, setIsSlotActive] = useState(false);

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
      const response = await slotReceipt(bookingId);
      fileDownload(response, `Slot-Receipt-${bookingId}.pdf`);
    } catch (error) {
      toast.error("Failed to download receipt");
    }
  };

  // Modified handleJoinCall to use instructor email from DTO
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Not Found</h2>
          <p className="text-gray-600">The booking details could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Booking Details
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Booked on {booking.bookedDateTime}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadReceipt}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md transition duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Receipt
              </button>

              {booking.bookingStatus === "confirmed" && isSlotActive && (
                <button
                  onClick={handleJoinCall}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-md transition duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Join Video Call
                </button>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-4">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                booking.bookingStatus
              )}`}
            >
              {booking.bookingStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Information Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Booking Information</h3>
                <p className="text-gray-600 text-sm">Your booking details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Booking ID</p>
                <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded mt-1">
                  {booking.bookingId.slice(-12).toUpperCase()}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Transaction ID</p>
                <p className="font-mono text-sm text-gray-800 mt-1">{booking.txnId}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600 mt-1">₹{booking.price.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Slot Information Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Slot Information</h3>
                <p className="text-gray-600 text-sm">Your scheduled session</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Slot ID</p>
                <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded mt-1">
                  {booking.slotId.slice(-12).toUpperCase()}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">{booking.slotDate}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Time</p>
                  <p className="text-gray-800 font-medium mt-1">{booking.startTime}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">End Time</p>
                  <p className="text-gray-800 font-medium mt-1">{booking.endTime}</p>
                </div>
              </div>

              {/* Slot Status Indicator */}
              {isSlotActive && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <p className="text-green-700 text-sm font-medium">Slot is currently active</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Student Information Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Student Information</h3>
                <p className="text-gray-600 text-sm">Your details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-gray-800 font-medium mt-1">{booking.studentName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-800 mt-1">{booking.studentEmail}</p>
              </div>
            </div>
          </div>

          {/* Instructor Information Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-orange-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Instructor Information</h3>
                <p className="text-gray-600 text-sm">Your instructor's details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-gray-800 font-medium mt-1">{booking.instructorName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-800 mt-1">{booking.instructorEmail}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Booking Summary</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
              <span>Session with {booking.instructorName}</span>
              <span>{booking.slotDate}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
              <span>Duration: {booking.startTime} - {booking.endTime}</span>
              <span className="font-medium">₹{booking.price}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between items-center font-semibold text-gray-800">
                <span>Total Amount Paid</span>
                <span className="text-lg">₹{booking.price}</span>
              </div>
            </div>
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