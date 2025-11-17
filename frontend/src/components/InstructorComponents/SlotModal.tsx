import { Dialog } from "@headlessui/react";
import { format, parseISO, isBefore } from "date-fns";
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
  const [startTime, setStartTime] = useState(""); // "14:30" (24h)
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState("");
  const [recurrence, setRecurrence] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(format(selectedDate, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Use UTC field for editing
  useEffect(() => {
    if (mode === "edit" && initialData) {
      // Use startTimeUTC (ISO string) → convert to IST → extract time
      const startIST = formatInTimeZone(initialData.startTimeUTC, IST, "HH:mm");
      const endIST = formatInTimeZone(initialData.endTimeUTC, IST, "HH:mm");

      setStartTime(startIST); // e.g. "15:00"
      setEndTime(endIST);     // e.g. "16:00"
      setPrice(initialData.price.toString());
      setRecurrence(false);
      setSelectedDays([]);
      setStartDate(format(selectedDate, "yyyy-MM-dd"));
      setEndDate("");
    } else {
      // Add mode: reset
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
      toast.error("All fields are required");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Price must be a positive number");
      return;
    }

    // Create ISO strings in IST timezone
    const startDateTimeStr = createISTDateTime(startDate, startTime);
    const endDateTimeStr = createISTDateTime(startDate, endTime);

    // Parse to Date objects for validation
    const startDateTime = parseISO(startDateTimeStr);
    const endDateTime = parseISO(endDateTimeStr);

    // Get current time in IST for validation
    const nowIST = formatInTimeZone(new Date(), IST, "yyyy-MM-dd'T'HH:mm:ss");
    const nowISTDate = parseISO(nowIST);
    
    // Get today's date in IST (date only, no time)
    const todayISTStr = formatInTimeZone(new Date(), IST, "yyyy-MM-dd");
    const [todayYear, todayMonth, todayDay] = todayISTStr.split('-').map(Number);
    const todayIST = new Date(todayYear, todayMonth - 1, todayDay);
    
    // Parse start date (date only)
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const startDateObj = new Date(startYear, startMonth - 1, startDay);

    // Validation: End time after start time
    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    // Validation: Recurrence fields
    if (recurrence && (!endDate || selectedDays.length === 0)) {
      toast.error("End date and days of week are required for recurring slots");
      return;
    }

    // Validation: Single slot - cannot be in the past
    if (!recurrence && isBefore(startDateTime, nowISTDate)) {
      toast.error("Cannot select a start time in the past");
      return;
    }

    // Validation: Recurrence start date must be today or future
    if (recurrence && startDateObj < todayIST) {
      toast.error("Recurrence start date must be today or in the future");
      return;
    }

    // Warning: If today's slot time is in the past
    if (recurrence && startDateObj.getTime() === todayIST.getTime() && isBefore(startDateTime, nowISTDate)) {
      toast.warn("Today's slot will be skipped as the start time is in the past.");
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
        if (response.success && (!response.slots || response.slots.length === 0)) {
          toast.warn("No slots were created (all potential slots were in the past or conflicted).");
        } else {
          toast.success(`Slot(s) created: ${response.slots?.length || 1} slot(s)`);
        }
      } else if (mode === "edit" && initialData) {
        await updateSlot(initialData.slotId, {
          startTime: startDateTimeStr,
          endTime: endDateTimeStr,
          price: priceNum,
        });
        toast.success("Slot updated");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      let message = "Failed to save slot(s)";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        const backendMessage = axiosErr.response?.data?.message;
        if (typeof backendMessage === "string") message = backendMessage;
      }
      toast.error(message);
      if (message.includes("overlaps")) toast.warn("Try a different time or date.");
      if (message.includes("No valid slots")) toast.error("No future slots could be created.");
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
                  onChange={(e) => setRecurrence(e.target.checked)}
                  className="mr-3 h-5 w-5"
                />
                <label className="font-semibold">Create recurring slots</label>
              </div>
            )}

            {recurrence && mode === "add" && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Days of Week</label>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`py-2 rounded text-sm font-medium ${
                          selectedDays.includes(day.value)
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
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
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border rounded pl-10 pr-3 py-2"
                  placeholder="500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-5 py-4 border-t">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 border rounded font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded font-medium disabled:opacity-50"
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