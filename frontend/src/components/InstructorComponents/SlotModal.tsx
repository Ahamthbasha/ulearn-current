import { Dialog } from "@headlessui/react";
import { format, isBefore, addDays, addMonths } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createSlot, updateSlot } from "../../api/action/InstructorActionApi";
import { type SlotModalProps } from "./interface/instructorComponentInterface";

const convertTo24Hour = (time12h: string) => {
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  let hoursNum = parseInt(hours, 10);

  if (modifier === "PM" && hoursNum !== 12) hoursNum += 12;
  if (modifier === "AM" && hoursNum === 12) hoursNum = 0;

  return `${hoursNum.toString().padStart(2, "0")}:${minutes}`;
};

const SlotModal = ({
  isOpen,
  onClose,
  mode,
  selectedDate,
  onSuccess,
  initialData,
}: SlotModalProps) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [repetitionMode, setRepetitionMode] = useState<"single" | "week" | "month" | "year">("single");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      // Convert 12-hour format to 24-hour format for time inputs
      setStartTime(convertTo24Hour(initialData.startTime));
      setEndTime(convertTo24Hour(initialData.endTime));
      setPrice(initialData.price);
      setRepetitionMode("single"); // Editing only supports single slot
    } else {
      setStartTime("");
      setEndTime("");
      setPrice("");
      setRepetitionMode("single");
    }
  }, [mode, initialData, isOpen, selectedDate]);

  const handleSubmit = async () => {
    if (!startTime || !endTime || price === "") {
      toast.error("All fields are required");
      return;
    }

    if (typeof price === "number" && price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    const baseDateString = format(selectedDate, "yyyy-MM-dd");
    const startDateTime = new Date(`${baseDateString}T${startTime}`);
    const endDateTime = new Date(`${baseDateString}T${endTime}`);
    const now = new Date();

    if (isBefore(startDateTime, now)) {
      toast.error("Cannot select a start time in the past");
      return;
    }

    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    setLoading(true);
    try {
      if (mode === "add") {
        const slotsToCreate = generateSlots(startDateTime, endDateTime, Number(price));
        await createSlot({
          slots: slotsToCreate,
          repetitionMode: repetitionMode,
        });
        toast.success("Slot(s) created");
      } else if (mode === "edit" && initialData) {
        await updateSlot(initialData.slotId, {
          startTime: startDateTime,
          endTime: endDateTime,
          price: Number(price),
        });
        toast.success("Slot updated");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save slot(s)");
    } finally {
      setLoading(false);
    }
  };

  const generateSlots = (start: Date, end: Date, price: number) => {
    const slots = [];

    if (repetitionMode === "single") {
      slots.push({ startTime: start, endTime: end, price });
    } else if (repetitionMode === "week") {
      for (let i = 0; i < 7; i++) {
        const newStart = addDays(start, i);
        const newEnd = addDays(end, i);
        slots.push({ startTime: newStart, endTime: newEnd, price });
      }
    } else if (repetitionMode === "month") {
      for (let i = 0; i < 30; i++) {
        const newStart = addDays(start, i);
        const newEnd = addDays(end, i);
        slots.push({ startTime: newStart, endTime: newEnd, price });
      }
    } else if (repetitionMode === "year") {
      for (let i = 0; i < 12; i++) {
        const newStart = addMonths(start, i);
        const newEnd = addMonths(end, i);
        slots.push({ startTime: newStart, endTime: newEnd, price });
      }
    }

    return slots;
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <Dialog.Title className="text-xl font-bold text-white">
              {mode === "add" ? "✨ Create New Slot" : "✏️ Edit Slot"}
            </Dialog.Title>
            <p className="text-blue-100 text-sm mt-1">
              {mode === "add" ? "Add a new time slot for bookings" : "Update your existing slot"}
            </p>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-5">
              {mode === "add" && (
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔄 Repetition
                  </label>
                  <select
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={repetitionMode}
                    onChange={(e) => setRepetitionMode(e.target.value as any)}
                  >
                    <option value="single">Single Day</option>
                    <option value="week">Every Day for a Week</option>
                    <option value="month">Every Day for a Month</option>
                    <option value="year">Every Month for a Year</option>
                  </select>
                </div>
              )}

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🕐 Start Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 group-hover:border-gray-300 bg-gray-50 focus:bg-white"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🕐 End Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 group-hover:border-gray-300 bg-gray-50 focus:bg-white"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  💰 Price (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    placeholder="Enter price..."
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 group-hover:border-gray-300 bg-gray-50 focus:bg-white pl-10"
                    value={price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setPrice("");
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setPrice(numValue);
                        }
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500 font-medium">₹</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-medium transition-all duration-200 disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    {mode === "add" ? "➕ Create Slot(s)" : "✅ Update Slot"}
                  </>
                )}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default SlotModal;