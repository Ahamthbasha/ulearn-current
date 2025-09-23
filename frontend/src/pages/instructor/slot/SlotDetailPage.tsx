import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { slotDetailsInInstructor } from "../../../api/action/InstructorActionApi";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import VideoCallModal from "../../../components/common/videocall/CreateCall"; 
import useVideoCall from "../../../components/common/videocall/UseVideoCall"; 
import { type BookingDetail } from "../interface/instructorInterface";

const SlotDetailPage = () => {
  const { slotId } = useParams<{ slotId: string }>();
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize useVideoCall hook
  const { showVideoCallModal, sender, handleCall, closeModal } = useVideoCall();

  const fetchSlotDetail = async () => {
    try {
      const { booking } = await slotDetailsInInstructor(slotId!);
      setBookingDetail(booking);
    } catch (err) {
      toast.error("Failed to load slot detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlotDetail();
  }, [slotId]);

  // Handle navigation after call ends
  const handleCloseModal = () => {
    closeModal();
    navigate(`/instructor/slots/${slotId}`); // Navigate to desired route after call ends
  };

  const handleJoinCall = () => {
    if (!bookingDetail?.studentId?.email) {
      toast.error("Student email not available");
      return;
    }
    console.log("Join Video Call Button Clicked - Instructor Side");
    handleCall(bookingDetail.studentId.email); // Trigger video call with student's email
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 text-center text-gray-500 bg-gray-50 min-h-screen flex items-center justify-center">
        Loading slot details...
      </div>
    );
  }

  if (!bookingDetail) {
    return (
      <div className="p-4 sm:p-6 text-center text-red-500 bg-gray-50 min-h-screen flex items-center justify-center">
        No slot found or you are not authorized to view this.
      </div>
    );
  }

  const { slotId: slot, studentId, instructorId, createdAt, updatedAt } = bookingDetail;
  const currentTime = new Date();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          Back to Slots
        </button>
      </div>

      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Slot Detail
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
        {/* Slot Information */}
        <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Slot Information</h3>
          <div className="space-y-3 text-sm sm:text-base">
            <div>
              <span className="font-medium text-gray-600">Start Time:</span>{" "}
              {format(parseISO(slot.startTime), "dd MMM yyyy, h:mm a")}
            </div>
            <div>
              <span className="font-medium text-gray-600">End Time:</span>{" "}
              {format(parseISO(slot.endTime), "dd MMM yyyy, h:mm a")}
            </div>
            <div>
              <span className="font-medium text-gray-600">Price:</span> ₹{slot.price}
            </div>
            <div>
              <span className="font-medium text-gray-600">Booking Status:</span>{" "}
              {slot.isBooked ? (
                <span className="text-green-600 font-semibold">Booked</span>
              ) : (
                <span className="text-yellow-600 font-semibold">Not Booked</span>
              )}
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Student Info</h3>
          {studentId ? (
            <div className="space-y-3 text-sm sm:text-base">
              <div>
                <span className="font-medium text-gray-600">Name:</span> {studentId.username}
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span> {studentId.email}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 italic text-sm sm:text-base">Not booked by any student</div>
          )}
        </div>

        {/* Instructor Information */}
        <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Instructor Info</h3>
          <div className="space-y-3 text-sm sm:text-base">
            <div>
              <span className="font-medium text-gray-600">Name:</span> {instructorId.username}
            </div>
            <div>
              <span className="font-medium text-gray-600">Email:</span> {instructorId.email}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Timestamps</h3>
          <div className="space-y-3 text-sm sm:text-base">
            <div>
              <span className="font-medium text-gray-600">Booking Created At:</span>{" "}
              {format(parseISO(createdAt), "dd MMM yyyy, h:mm a")}
            </div>
            <div>
              <span className="font-medium text-gray-600">Last Updated:</span>{" "}
              {format(parseISO(updatedAt), "dd MMM yyyy, h:mm a")}
            </div>
          </div>
        </div>
      </div>

      {slot.isBooked &&
        currentTime >= new Date(slot.startTime) &&
        currentTime <= new Date(slot.endTime) && (
          <div className="mt-6 text-center">
            <button
              onClick={handleJoinCall}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 text-sm sm:text-base shadow-md hover:shadow-xl"
            >
              Join Call
            </button>
          </div>
        )}

      {/* Video Call Modal */}
      {showVideoCallModal && (
        <VideoCallModal
          to={sender}
          isOpen={showVideoCallModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default SlotDetailPage;