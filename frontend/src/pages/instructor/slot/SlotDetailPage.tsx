import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { slotDetailsInInstructor } from "../../../api/action/InstructorActionApi";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import VideoCallModal from "../../../components/common/videocall/CreateCall"; // Import VideoCallModal
import useVideoCall from "../../../components/common/videocall/UseVideoCall"; // Import useVideoCall hook

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
  isBooked: boolean;
}

interface User {
  username: string;
  email: string;
}

interface BookingDetail {
  _id: string;
  slotId: Slot;
  studentId?: User;
  instructorId: User;
  createdAt: string;
  updatedAt: string;
}

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
      <div className="p-6 text-center text-gray-500">
        Loading slot details...
      </div>
    );
  }

  if (!bookingDetail) {
    return (
      <div className="p-6 text-center text-red-500">
        No slot found or you are not authorized to view this.
      </div>
    );
  }

  const { slotId: slot, studentId, instructorId, createdAt, updatedAt } = bookingDetail;
  const currentTime = new Date();

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4 text-gray-800">Slot Detail</h2>

      <div className="space-y-4 text-sm text-gray-700">
        <div>
          <span className="font-medium">Start Time:</span>{" "}
          {format(parseISO(slot.startTime), "dd MMM yyyy, h:mm a")}
        </div>
        <div>
          <span className="font-medium">End Time:</span>{" "}
          {format(parseISO(slot.endTime), "dd MMM yyyy, h:mm a")}
        </div>
        <div>
          <span className="font-medium">Price:</span> ₹{slot.price}
        </div>
        <div>
          <span className="font-medium">Booking Status:</span>{" "}
          {slot.isBooked ? (
            <span className="text-green-600 font-semibold">Booked</span>
          ) : (
            <span className="text-yellow-600 font-semibold">Not Booked</span>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-800 mb-2">Student Info</h3>
          {studentId ? (
            <>
              <div>
                <span className="font-medium">Name:</span> {studentId.username}
              </div>
              <div>
                <span className="font-medium">Email:</span> {studentId.email}
              </div>
            </>
          ) : (
            <div className="text-gray-500 italic">Not booked by any student</div>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-800 mb-2">Instructor Info</h3>
          <div>
            <span className="font-medium">Name:</span> {instructorId.username}
          </div>
          <div>
            <span className="font-medium">Email:</span> {instructorId.email}
          </div>
        </div>

        <div className="border-t pt-4">
          <div>
            <span className="font-medium">Booking Created At:</span>{" "}
            {format(parseISO(createdAt), "dd MMM yyyy, h:mm a")}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span>{" "}
            {format(parseISO(updatedAt), "dd MMM yyyy, h:mm a")}
          </div>
        </div>

        {slot.isBooked &&
          currentTime >= new Date(slot.startTime) &&
          currentTime <= new Date(slot.endTime) && (
            <div className="pt-4">
              <button
                onClick={handleJoinCall}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
              >
                Join Call
              </button>
            </div>
          )}
      </div>

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