import { useEffect, useState } from "react";
import { listSlots, deleteSlot } from "../../../api/action/InstructorActionApi";
import { format, isSameDay, parseISO, startOfWeek, addDays } from "date-fns";
import { toast } from "react-toastify";
import { PlusCircle, Trash2, Pencil } from "lucide-react";
import SlotModal from "../../../components/InstructorComponents/SlotModal";
import { useNavigate } from "react-router-dom";

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
  isBooked: boolean;
}

const daysToRender = 7;

const SlotPage = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStartDate, setWeekStartDate] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

  const navigate = useNavigate();

  const fetchSlots = async () => {
    try {
      const { slots } = await listSlots();
      setSlots(slots);
    } catch (err) {
      toast.error("Failed to fetch slots");
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlot(slotId);
      toast.success("Slot deleted");
      fetchSlots();
    } catch (err) {
      toast.error("Failed to delete slot");
    }
  };

  const getSlotsForDate = (date: Date) => {
    return slots.filter((slot) => isSameDay(parseISO(slot.startTime), date));
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingSlot(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot: Slot) => {
    setModalMode("edit");
    setEditingSlot(slot);
    setIsModalOpen(true);
  };

  const goToPreviousWeek = () => {
    const newStart = addDays(weekStartDate, -7);
    setWeekStartDate(newStart);
    setSelectedDate(newStart);
  };

  const goToNextWeek = () => {
    const newStart = addDays(weekStartDate, 7);
    setWeekStartDate(newStart);
    setSelectedDate(newStart);
  };

  const weekEndDate = addDays(weekStartDate, 6);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Select Time Slot</h2>
        <button
          onClick={() => navigate("/instructor/slotsHistory")}
          className="text-sm text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-600 hover:text-white transition"
        >
          See Slot History
        </button>
      </div>

      {/* Week navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={goToPreviousWeek}
        >
          ← Previous Week
        </button>
        <span className="text-sm font-medium">
          {format(weekStartDate, "MMM d")} - {format(weekEndDate, "MMM d")}
        </span>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={goToNextWeek}
        >
          Next Week →
        </button>
      </div>

      {/* Day selector */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {[...Array(daysToRender)].map((_, index) => {
          const day = addDays(weekStartDate, index);
          const isSelected = isSameDay(selectedDate, day);

          return (
            <button
              key={index}
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col justify-center items-center px-3 py-2 rounded-md text-sm font-medium border transition
                ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-700"
                    : "bg-gray-100 text-gray-800 border-transparent hover:bg-gray-200"
                }`}
            >
              <span className="text-base font-bold">{format(day, "d")}</span>
              <span className="text-xs font-medium">{format(day, "EEE")}</span>
            </button>
          );
        })}
      </div>

      {/* Date label */}
      <div className="text-sm font-semibold mb-2">
        {format(selectedDate, "EEEE, MMM d")}
      </div>

      {/* Time slots display */}
      <div className="flex flex-wrap gap-3 items-start min-h-[40px]">
        {getSlotsForDate(selectedDate).length > 0 ? (
          getSlotsForDate(selectedDate).map((slot) => (
            <div
              key={slot._id}
              onClick={() =>
                slot.isBooked ? navigate(`/instructor/slots/${slot._id}`) : undefined
              }
              className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm ${
                slot.isBooked
                  ? "bg-red-100 text-red-700 border-red-300 cursor-pointer hover:bg-red-200"
                  : "bg-blue-50 text-blue-700 border-blue-300"
              }`}
            >
              <span>
                {format(parseISO(slot.startTime), "h:mm a")} -{" "}
                {format(parseISO(slot.endTime), "h:mm a")}
              </span>
              {!slot.isBooked && (
                <>
                  <button onClick={() => handleOpenEditModal(slot)}>
                    <Pencil className="w-4 h-4 text-blue-500" />
                  </button>
                  <button onClick={() => handleDeleteSlot(slot._id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="text-gray-500 italic">No Slots Allotted</div>
        )}
      </div>

      {/* Add Slots Button */}
      <div className="mt-4">
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Add Slots
        </button>
      </div>

      {/* Slot Modal */}
      <SlotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        selectedDate={selectedDate}
        onSuccess={() => {
          fetchSlots();
          setIsModalOpen(false);
        }}
        initialData={editingSlot}
      />
    </div>
  );
};

export default SlotPage;
