import { Dialog } from "@headlessui/react";
import { format, parseISO, isBefore, addDays, startOfDay } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createSlot, updateSlot } from "../../api/action/InstructorActionApi";
import type { SlotModalProps, RecurrenceRule } from "./interface/instructorComponentInterface";
import type { AxiosError } from "axios";
import { createISTDateTime, createISTDateOnly } from "../../utils/timezone";
import { formatInTimeZone } from "date-fns-tz";

const IST = "Asia/Kolkata";

const weekDays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

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
  const [price, setPrice] = useState("");
  const [recurrence, setRecurrence] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(format(selectedDate, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Get today's date in IST (YYYY-MM-DD)
  const todayIST = formatInTimeZone(new Date(), IST, "yyyy-MM-dd");

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && initialData) {
      const startIST = formatInTimeZone(initialData.startTimeUTC, IST, "HH:mm");
      const endIST = formatInTimeZone(initialData.endTimeUTC, IST, "HH:mm");

      setStartTime(startIST);
      setEndTime(endIST);
      setPrice(initialData.price.toString());
      setRecurrence(false);
      setSelectedDays([]);
      setStartDate(format(selectedDate, "yyyy-MM-dd"));
      setEndDate("");
    } else {
      setStartTime("");
      setEndTime("");
      setPrice("");
      setRecurrence(false);
      setSelectedDays([]);
      setStartDate(format(selectedDate, "yyyy-MM-dd"));
      setEndDate("");
    }
  }, [mode, initialData, isOpen, selectedDate]);

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async () => {
    if (!startTime || !endTime || !price) {
      toast.error("Start time, end time, and price are required");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Price must be a positive number");
      return;
    }

    // Create ISO strings in IST
    const startDateTimeStr = createISTDateTime(startDate, startTime);
    const endDateTimeStr = createISTDateTime(startDate, endTime);

    const startDateTime = parseISO(startDateTimeStr);
    const endDateTime = parseISO(endDateTimeStr);

    const nowIST = new Date();
    const todayStart = startOfDay(nowIST);

    // Validate end time > start time
    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    // Recurrence validations
    if (recurrence) {
      if (selectedDays.length === 0) {
        toast.error("Please select at least one day of the week");
        return;
      }
      if (!endDate) {
        toast.error("End date is required for recurring slots");
        return;
      }

      // Validate Start Date ≥ Today
      const selectedStartDate = new Date(startDate);
      if (isBefore(selectedStartDate, todayStart)) {
        toast.error("Recurrence start date cannot be in the past");
        return;
      }

      // Validate End Date > Start Date
      const selectedEndDate = new Date(endDate);
      if (isBefore(selectedEndDate, addDays(selectedStartDate, 1))) {
        toast.error("End date must be after the start date");
        return;
      }
    }

    // Single slot: cannot be in the past
    if (!recurrence) {
      const nowISTStr = formatInTimeZone(nowIST, IST, "yyyy-MM-dd'T'HH:mm");
      const nowISTDate = parseISO(nowISTStr);
      if (isBefore(startDateTime, nowISTDate)) {
        toast.error("Cannot create a slot in the past");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "add") {
        const slotData = {
          startTime: startDateTimeStr,
          endTime: endDateTimeStr,
          price: priceNum,
          ...(recurrence && {
            recurrenceRule: {
              daysOfWeek: selectedDays,
              startDate: createISTDateOnly(startDate, "start"),
              endDate: createISTDateOnly(endDate, "end"),
            } satisfies RecurrenceRule,
          }),
        };

        const response = await createSlot(slotData);
        const count = Array.isArray(response.slots) ? response.slots.length : 1;

        if (response.success && count === 0) {
          toast.warn("No slots created — all dates may be in the past or overlapping");
        } else {
          toast.success(`Successfully created ${count} slot${count > 1 ? "s" : ""}`);
        }
      } else if (mode === "edit" && initialData) {
        await updateSlot(initialData.slotId, {
          startTime: startDateTimeStr,
          endTime: endDateTimeStr,
          price: priceNum,
        });
        toast.success("Slot updated successfully");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      let message = "Failed to save slot(s)";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        message = axiosErr.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <Dialog.Panel className="w-full max-w-md transform overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-h-[90vh] sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 sm:px-4 sm:py-3">
            <Dialog.Title className="text-base font-bold text-white sm:text-lg md:text-xl">
              {mode === "add" ? "Create New Slot" : "Edit Slot"}
            </Dialog.Title>
          </div>

          <div className="px-3 py-4 sm:px-5 sm:py-6 space-y-4">
            {mode === "add" && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={recurrence}
                  onChange={(e) => {
                    setRecurrence(e.target.checked);
                    if (!e.target.checked) {
                      setEndDate("");
                      setSelectedDays([]);
                    }
                  }}
                  className="mr-3 h-5 w-5 accent-purple-600"
                />
                <label className="font-semibold">Create recurring slots</label>
              </div>
            )}

            {recurrence && mode === "add" && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    min={todayIST} // Prevents past dates
                    onChange={(e) => {
                      const val = e.target.value;
                      setStartDate(val);
                      // Auto-clear endDate if it's now before new startDate
                      if (endDate && endDate < val) {
                        setEndDate("");
                      }
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Cannot be in the past</p>
                </div>

                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate ? format(addDays(new Date(startDate), 1), "yyyy-MM-dd") : todayIST}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be after start date</p>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Days of Week</label>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`py-2 rounded text-sm font-medium transition-all ${
                          selectedDays.includes(day.value)
                            ? "bg-purple-600 text-white shadow-md"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block font-semibold mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Price (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-600 font-bold">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border rounded pl-10 pr-3 py-2"
                  placeholder="500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-5 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 border rounded font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded font-medium shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {loading ? "Saving..." : mode === "add" ? "Create Slot(s)" : "Update Slot"}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default SlotModal;