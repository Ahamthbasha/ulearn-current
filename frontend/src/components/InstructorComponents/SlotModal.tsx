// import { Dialog } from "@headlessui/react";
// import { format, isBefore, isSameDay } from "date-fns";
// import { useEffect, useState } from "react";
// import { toast } from "react-toastify";
// import { createSlot, updateSlot } from "../../api/action/InstructorActionApi";
// import type { SlotModalProps,RecurrenceRule } from "./interface/instructorComponentInterface";
// import type { AxiosError } from "axios";

// const convertTo24Hour = (time12h: string): string => {
//   const [time, modifier] = time12h.split(" ");
//   const [hours, minutes] = time.split(":");
//   let hoursNum = parseInt(hours, 10);
//   if (modifier === "PM" && hoursNum !== 12) hoursNum += 12;
//   if (modifier === "AM" && hoursNum === 12) hoursNum = 0;
//   return `${hoursNum.toString().padStart(2, "0")}:${minutes}`;
// };

// const weekDays = [
//   { value: 0, label: "Sunday" },
//   { value: 1, label: "Monday" },
//   { value: 2, label: "Tuesday" },
//   { value: 3, label: "Wednesday" },
//   { value: 4, label: "Thursday" },
//   { value: 5, label: "Friday" },
//   { value: 6, label: "Saturday" },
// ];

// const SlotModal = ({
//   isOpen,
//   onClose,
//   mode,
//   selectedDate,
//   onSuccess,
//   initialData,
// }: SlotModalProps) => {
//   const [startTime, setStartTime] = useState("");
//   const [endTime, setEndTime] = useState("");
//   const [price, setPrice] = useState("");
//   const [recurrence, setRecurrence] = useState(false);
//   const [selectedDays, setSelectedDays] = useState<number[]>([]);
//   const [startDate, setStartDate] = useState(format(selectedDate, "yyyy-MM-dd"));
//   const [endDate, setEndDate] = useState("");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (mode === "edit" && initialData) {
//       setStartTime(convertTo24Hour(initialData.startTime));
//       setEndTime(convertTo24Hour(initialData.endTime));
//       setPrice(initialData.price.toString());
//       setRecurrence(false);
//       setSelectedDays([]);
//       setStartDate(format(selectedDate, "yyyy-MM-dd"));
//       setEndDate("");
//     } else {
//       setStartTime("");
//       setEndTime("");
//       setPrice("");
//       setRecurrence(false);
//       setSelectedDays([]);
//       setStartDate(format(selectedDate, "yyyy-MM-dd"));
//       setEndDate("");
//     }
//   }, [mode, initialData, isOpen, selectedDate]);

//   const handleDayToggle = (day: number) => {
//     setSelectedDays((prev) =>
//       prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
//     );
//   };

//   const handleSubmit = async () => {
//     if (!startTime || !endTime || !price) {
//       toast.error("All fields are required");
//       return;
//     }

//     const priceNum = parseFloat(price);
//     if (isNaN(priceNum) || priceNum <= 0) {
//       toast.error("Price must be a positive number");
//       return;
//     }

//     const now = new Date();
//     const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const startDateObj = new Date(startDate);
//     const startDateOnly = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
//     const startDateTime = new Date(`${startDate}T${startTime}`);
//     const endDateTime = new Date(`${startDate}T${endTime}`);

//     if (endDateTime <= startDateTime) {
//       toast.error("End time must be after start time");
//       return;
//     }

//     if (recurrence && (!endDate || selectedDays.length === 0)) {
//       toast.error("End date and days of week are required for recurring slots");
//       return;
//     }

//     if (!recurrence && isBefore(startDateTime, now)) {
//       toast.error("Cannot select a start time in the past");
//       return;
//     }

//     if (recurrence && startDateOnly < today) {
//       toast.error("Recurrence start date must be today or in the future");
//       return;
//     }

//     if (recurrence && isSameDay(startDateObj, today) && isBefore(startDateTime, now)) {
//       toast.warn("Today's slot will be skipped as the start time is in the past.");
//     }

//     setLoading(true);
//     try {
//       if (mode === "add") {
//         const slotData: {
//           startTime:Date;
//           endTime:Date;
//           price:number;
//           recurrenceRule?:RecurrenceRule
//         } = {
//           startTime: startDateTime,
//           endTime: endDateTime,
//           price: priceNum,
//         };

//         if (recurrence) {
//           slotData.recurrenceRule = {
//             daysOfWeek: selectedDays,
//             startDate: new Date(startDate),
//             endDate: new Date(endDate),
//           };
//         }

//         const response = await createSlot(slotData);
//         if (response.success && (!response.slots || response.slots.length === 0)) {
//           toast.warn("No slots were created (all potential slots were in the past or conflicted).");
//         } else {
//           toast.success(`Slot(s) created: ${response.slots?.length || 1} slot(s)`);
//         }
//       } else if (mode === "edit" && initialData) {
//         await updateSlot(initialData.slotId, {
//           startTime: startDateTime,
//           endTime: endDateTime,
//           price: priceNum,
//         });
//         toast.success("Slot updated");
//       }
//       onSuccess();
//     } catch (err: unknown) {
//   let message = "Failed to save slot(s)";

//   if (err && typeof err === 'object' && 'response' in err) {
//     const axiosErr = err as AxiosError<{ message?: string }>;
//     const backendMessage = axiosErr.response?.data?.message;

//     if (typeof backendMessage === "string") {
//       message = backendMessage;
//     }
//   }

//   toast.error(message);

//   if (message.includes("overlaps")) {
//     toast.warn("Try a different time or date.");
//   }
//   if (message.includes("No valid slots")) {
//     toast.error("No future slots could be created.");
//   }
// }finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Dialog open={isOpen} onClose={onClose} className="relative z-50">
//       <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
//       <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
//         <Dialog.Panel className="w-full max-w-md transform overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-h-[90vh] sm:max-w-lg md:max-w-xl lg:max-w-2xl">
//           <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 sm:px-4 sm:py-3">
//             <Dialog.Title className="text-base font-bold text-white sm:text-lg md:text-xl">
//               {mode === "add" ? "Create New Slot" : "Edit Slot"}
//             </Dialog.Title>
//             <p className="text-blue-100 text-xs sm:text-sm md:text-base mt-1">
//               {mode === "add" ? "Add a new time slot for bookings" : "Update your existing slot"}
//             </p>
//           </div>

//           <div className="px-3 py-4 sm:px-5 sm:py-6 space-y-3 sm:space-y-4">
//             {/* Recurrence Toggle */}
//             {mode === "add" && (
//               <div className="group">
//                 <label className="block text-sm font-semibold text-gray-700 mb-1">Recurring Slots</label>
//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     checked={recurrence}
//                     onChange={(e) => setRecurrence(e.target.checked)}
//                     className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
//                   />
//                   <span className="text-sm sm:text-base">Create recurring slots</span>
//                 </div>
//               </div>
//             )}

//             {/* Recurrence Fields */}
//             {recurrence && mode === "add" && (
//               <>
//                 <div className="group">
//                   <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
//                   <input
//                     type="date"
//                     className="w-full border-2 border-gray-200 px-2 py-1 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm sm:text-base sm:px-3 sm:py-2"
//                     value={startDate}
//                     onChange={(e) => setStartDate(e.target.value)}
//                   />
//                 </div>
//                 <div className="group">
//                   <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
//                   <input
//                     type="date"
//                     className="w-full border-2 border-gray-200 px-2 py-1 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm sm:text-base sm:px-3 sm:py-2"
//                     value={endDate}
//                     onChange={(e) => setEndDate(e.target.value)}
//                   />
//                 </div>
//                 <div className="group">
//                   <label className="block text-sm font-semibold text-gray-700 mb-1">Days of Week</label>
//                   <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1 sm:gap-2">
//                     {weekDays.map((day) => (
//                       <button
//                         key={day.value}
//                         type="button"
//                         onClick={() => handleDayToggle(day.value)}
//                         className={`px-1 py-1 rounded-full border text-xs sm:text-sm ${
//                           selectedDays.includes(day.value)
//                             ? "bg-blue-500 text-white border-blue-500"
//                             : "bg-gray-100 text-gray-800 border-gray-300"
//                         }`}
//                       >
//                         {day.label}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </>
//             )}

//             {/* Time & Price */}
//             <div className="group">
//               <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
//               <input
//                 type="time"
//                 className="w-full border-2 border-gray-200 px-2 py-1 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm sm:text-base sm:px-3 sm:py-2"
//                 value={startTime}
//                 onChange={(e) => setStartTime(e.target.value)}
//               />
//             </div>

//             <div className="group">
//               <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
//               <input
//                 type="time"
//                 className="w-full border-2 border-gray-200 px-2 py-1 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm sm:text-base sm:px-3 sm:py-2"
//                 value={endTime}
//                 onChange={(e) => setEndTime(e.target.value)}
//               />
//             </div>

//             <div className="group">
//               <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
//               <div className="relative">
//                 <input
//                   type="number"
//                   min={0}
//                   step="0.01"
//                   placeholder="Enter price..."
//                   className="w-full border-2 border-gray-200 pl-6 pr-2 py-1 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm sm:text-base sm:px-3 sm:py-2 md:pl-8"
//                   value={price}
//                   onChange={(e) => setPrice(e.target.value)}
//                 />
//                 <span className="absolute inset-y-0 left-0 flex items-center pl-1 sm:pl-2 text-gray-500 font-medium text-sm sm:text-base">₹</span>
//               </div>
//             </div>
//           </div>

//           <div className="flex justify-end gap-2 px-3 py-3 sm:px-5 sm:py-4 sm:gap-3 border-t">
//             <button
//               onClick={onClose}
//               disabled={loading}
//               className="px-3 py-1 rounded-md border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm sm:text-base disabled:opacity-50"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSubmit}
//               disabled={loading}
//               className="px-3 py-1 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-1"
//             >
//               {loading ? (
//                 <>Saving...</>
//               ) : (
//                 <>{mode === "add" ? "Create Slot(s)" : "Update Slot"}</>
//               )}
//             </button>
//           </div>
//         </Dialog.Panel>
//       </div>
//     </Dialog>
//   );
// };

// export default SlotModal;


























// src/components/InstructorComponents/SlotModal.tsx
import { Dialog } from "@headlessui/react";
import { format, isBefore, isSameDay } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createSlot, updateSlot } from "../../api/action/InstructorActionApi";
import type { SlotModalProps, RecurrenceRule } from "./interface/instructorComponentInterface";
import type { AxiosError } from "axios";
import { createISTDateTime, createISTDateOnly } from "../../utils/timezone";

const convertTo24Hour = (time12h: string): string => {
  const [time, modifier] = time12h.split(" ");
  const [hours, minutes] = time.split(":");
  let hoursNum = parseInt(hours, 10);
  if (modifier === "PM" && hoursNum !== 12) hoursNum += 12;
  if (modifier === "AM" && hoursNum === 12) hoursNum = 0;
  return `${hoursNum.toString().padStart(2, "0")}:${minutes}`;
};

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

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setStartTime(convertTo24Hour(initialData.startTime));
      setEndTime(convertTo24Hour(initialData.endTime));
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
      toast.error("All fields are required");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Price must be a positive number");
      return;
    }

    const startDateTimeStr = createISTDateTime(startDate, startTime);
    const endDateTimeStr = createISTDateTime(startDate, endTime);

    const startDateTime = new Date(startDateTimeStr);
    const endDateTime = new Date(endDateTimeStr);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDateObj = new Date(startDate);
    const startDateOnly = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());

    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    if (recurrence && (!endDate || selectedDays.length === 0)) {
      toast.error("End date and days of week are required for recurring slots");
      return;
    }

    if (!recurrence && isBefore(startDateTime, now)) {
      toast.error("Cannot select a start time in the past");
      return;
    }

    if (recurrence && startDateOnly < today) {
      toast.error("Recurrence start date must be today or in the future");
      return;
    }

    if (recurrence && isSameDay(startDateObj, today) && isBefore(startDateTime, now)) {
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
            <p className="text-blue-100 text-xs sm:text-sm md:text-base mt-1">
              {mode === "add" ? "Add a new time slot for bookings" : "Update your existing slot"}
            </p>
          </div>

          <div className="px-3 py-4 sm:px-5 sm:py-6 space-y-3 sm:space-y-4">
            {mode === "add" && (
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Recurring Slots</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={recurrence}
                    onChange={(e) => setRecurrence(e.target.checked)}
                    className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                  />
                  <span className="text-sm sm:text-base">Create recurring slots</span>
                </div>
              </div>
            )}

            {recurrence && mode === "add" && (
              <>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full border-2 border-gray-200 px-2 py-1 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm sm:text-base sm:px-3 sm:py-2"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full border-2 border-gray-200 px-2 py-1 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm sm:text-base sm:px-3 sm:py-2"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Days of Week</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1 sm:gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`px-1 py-1 rounded-full border text-xs sm:text-sm ${
                          selectedDays.includes(day.value)
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-gray-100 text-gray-800 border-gray-300"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                className="w-full border-2 border-gray-200 px-2 py-1 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm sm:text-base sm:px-3 sm:py-2"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                className="w-full border-2 border-gray-200 px-2 py-1 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm sm:text-base sm:px-3 sm:py-2"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Enter price..."
                  className="w-full border-2 border-gray-200 pl-6 pr-2 py-1 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm sm:text-base sm:px-3 sm:py-2 md:pl-8"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <span className="absolute inset-y-0 left-0 flex items-center pl-1 sm:pl-2 text-gray-500 font-medium text-sm sm:text-base">₹</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-3 py-3 sm:px-5 sm:py-4 sm:gap-3 border-t">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1 rounded-md border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm sm:text-base disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-3 py-1 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-1"
            >
              {loading ? <>Saving...</> : <>{mode === "add" ? "Create Slot(s)" : "Update Slot"}</>}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default SlotModal;