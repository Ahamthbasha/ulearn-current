import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSlotsOfParticularInstructor } from "../../../api/action/StudentAction";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { isStudentLoggedIn } from "../../../utils/auth";
import { type Slot } from "../interface/studentInterface";

const StudentAvailableSlotsPage = () => {
  const { instructorId } = useParams();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = isStudentLoggedIn();

  useEffect(() => {
    if (instructorId) {
      fetchSlots(instructorId);
    }
  }, [instructorId]);

  const fetchSlots = async (id: string) => {
    try {
      const res = await getSlotsOfParticularInstructor(id);
      setSlots(res.data || []);
    } catch (err) {
      toast.error("Failed to load slots.");
    } finally {
      setLoading(false);
    }
  };

  const groupSlotsByDate = (slots: Slot[]) => {
    const grouped: Record<string, Slot[]> = {};
    slots.forEach((slot) => {
      const dateKey = format(new Date(slot.startTime), "yyyy-MM-dd");
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(slot);
    });
    return grouped;
  };

  const groupedSlots = groupSlotsByDate(slots);

  return (
    <div className="min-h-screen px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 bg-gray-50">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 md:mb-8 text-gray-800">
        Available Slots
      </h2>

      {loading ? (
        <p className="text-center text-gray-600 text-sm sm:text-base">Loading...</p>
      ) : slots.length === 0 ? (
        <p className="text-center text-red-500 text-sm sm:text-base">No slots available.</p>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {Object.entries(groupedSlots).map(([date, daySlots]) => (
            <div key={date} className="bg-white p-3 sm:p-4 md:p-5 rounded-xl shadow">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-blue-600 mb-2 sm:mb-3">
                {format(new Date(date), "eeee, MMMM d, yyyy")}
              </h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {daySlots.map((slot) => (
                  <button
                    key={slot._id}
                    className="px-2 sm:px-3 py-1 sm:py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    disabled={slot.isBooked}
                    onClick={() => {
                      if (!isLoggedIn) {
                        toast.info("Please login to book a slot.");
                        navigate("/user/login");
                      } else {
                        navigate(`/user/checkout/${slot._id}`);
                      }
                    }}
                  >
                    {format(new Date(slot.startTime), "hh:mm a")} -{" "}
                    {format(new Date(slot.endTime), "hh:mm a")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAvailableSlotsPage;