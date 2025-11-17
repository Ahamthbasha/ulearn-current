// import { useEffect, useState } from "react";
// import { listSlots, deleteSlot, deleteUnbookedSlotsForDate } from "../../../api/action/InstructorActionApi";
// import { format, isSameDay, startOfWeek, addDays } from "date-fns";
// import { toast } from "react-toastify";
// import { PlusCircle, Trash2, Pencil } from "lucide-react";
// import SlotModal from "../../../components/InstructorComponents/SlotModal";
// import { useNavigate } from "react-router-dom";
// import type { SlotDTO } from "../../../components/InstructorComponents/interface/instructorComponentInterface";
// import type { ApiError } from "../../../types/interfaces/ICommon";

// const daysToRender = 7;

// const SlotPage = () => {
//   const [slots, setSlots] = useState<SlotDTO[]>([]);
//   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
//   const [weekStartDate, setWeekStartDate] = useState<Date>(
//     startOfWeek(new Date(), { weekStartsOn: 1 })
//   );
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalMode, setModalMode] = useState<"add" | "edit">("add");
//   const [editingSlot, setEditingSlot] = useState<SlotDTO | null>(null);

//   const navigate = useNavigate();

//   const fetchSlots = async (date?: Date) => {
//     try {
//       const formattedDate = date ? format(date, "yyyy-MM-dd") : format(selectedDate, "yyyy-MM-dd");
//       const response = await listSlots(formattedDate);
//       setSlots(response.slots || []);
//     } 
//     catch (err) {
//   const apiError = err as ApiError;
//   const message = apiError.response?.data?.message || "Failed to fetch slots";
//   toast.error(message);
// }
//   };

//   useEffect(() => {
//     fetchSlots();
//   }, [selectedDate]);

//   const handleDeleteSlot = async (slotId: string) => {
//     try {
//       await deleteSlot(slotId);
//       toast.success("Slot deleted");
//       fetchSlots(selectedDate);
//     } 
//     catch (err) {
//   const apiError = err as ApiError;
//   const message = apiError.response?.data?.message || "Failed to delete slot";
//   toast.error(message);
// }
//   };

//   const handleDeleteUnbookedSlots = async () => {
//     try {
//       const formattedDate = format(selectedDate, "yyyy-MM-dd");
//       await deleteUnbookedSlotsForDate(formattedDate);
//       toast.success("All unbooked slots deleted for the date");
//       fetchSlots(selectedDate);
//     }
//     catch (err) {
//   const apiError = err as ApiError;
//   const message = apiError.response?.data?.message || "Failed to delete unbooked slots";
//   toast.error(message);
// }
//   };

//   const getSlotsForDate = () => slots;

//   const handleOpenAddModal = () => {
//     setModalMode("add");
//     setEditingSlot(null);
//     setIsModalOpen(true);
//   };

//   const handleOpenEditModal = (slot: SlotDTO) => {
//     setModalMode("edit");
//     setEditingSlot(slot);
//     setIsModalOpen(true);
//   };

//   const goToPreviousWeek = () => {
//     const newStart = addDays(weekStartDate, -7);
//     setWeekStartDate(newStart);
//     setSelectedDate(newStart);
//   };

//   const goToNextWeek = () => {
//     const newStart = addDays(weekStartDate, 7);
//     setWeekStartDate(newStart);
//     setSelectedDate(newStart);
//   };

//   const weekEndDate = addDays(weekStartDate, 6);

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-semibold">Select Time Slot</h2>
//         <button
//           onClick={() => navigate("/instructor/slotsHistory")}
//           className="text-sm text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-600 hover:text-white transition"
//         >
//           See Slot History
//         </button>
//       </div>

//       <div className="flex justify-between items-center mb-4">
//         <button className="text-sm text-blue-600 hover:underline" onClick={goToPreviousWeek}>
//           Previous Week
//         </button>
//         <span className="text-sm font-medium">
//           {format(weekStartDate, "MMM d")} - {format(weekEndDate, "MMM d")}
//         </span>
//         <button className="text-sm text-blue-600 hover:underline" onClick={goToNextWeek}>
//           Next Week
//         </button>
//       </div>

//       <div className="grid grid-cols-7 gap-3 mb-6">
//         {[...Array(daysToRender)].map((_, index) => {
//           const day = addDays(weekStartDate, index);
//           const isSelected = isSameDay(selectedDate, day);

//           return (
//             <button
//               key={index}
//               onClick={() => setSelectedDate(day)}
//               className={`flex flex-col justify-center items-center px-3 py-2 rounded-md text-sm font-medium border transition
//                 ${isSelected
//                   ? "bg-blue-600 text-white border-blue-700"
//                   : "bg-gray-100 text-gray-800 border-transparent hover:bg-gray-200"
//                 }`}
//             >
//               <span className="text-base font-bold">{format(day, "d")}</span>
//               <span className="text-xs font-medium">{format(day, "EEE")}</span>
//             </button>
//           );
//         })}
//       </div>

//       <div className="text-sm font-semibold mb-2">
//         {format(selectedDate, "EEEE, MMM d")}
//       </div>

//       <div className="flex flex-wrap gap-3 items-start min-h-[40px]">
//         {getSlotsForDate().length > 0 ? (
//           getSlotsForDate().map((slot) => (
//             <div
//               key={slot.slotId}
//               onClick={() => slot.isBooked && navigate(`/instructor/slots/${slot.slotId}`)}
//               className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm cursor-pointer
//                 ${slot.isBooked
//                   ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
//                   : "bg-blue-50 text-blue-700 border-blue-300"
//                 }`}
//             >
//               <span>{slot.startTime} - {slot.endTime}</span>
//               {!slot.isBooked && (
//                 <>
//                   <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(slot); }}>
//                     <Pencil className="w-4 h-4 text-blue-500" />
//                   </button>
//                   <button onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.slotId); }}>
//                     <Trash2 className="w-4 h-4 text-red-500" />
//                   </button>
//                 </>
//               )}
//             </div>
//           ))
//         ) : (
//           <div className="text-gray-500 italic">No Slots Allotted</div>
//         )}
//       </div>

//       <div className="mt-4 flex gap-4">
//         <button onClick={handleOpenAddModal} className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
//           <PlusCircle className="w-4 h-4" /> Add Slots
//         </button>
//         {slots.length > 0 && (
//           <button onClick={handleDeleteUnbookedSlots} className="flex items-center gap-2 text-red-600 hover:underline text-sm">
//             <Trash2 className="w-4 h-4" /> Delete All Unbooked Slots
//           </button>
//         )}
//       </div>

//       <SlotModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         mode={modalMode}
//         selectedDate={selectedDate}
//         onSuccess={() => {
//           fetchSlots(selectedDate);
//           setIsModalOpen(false);
//         }}
//         initialData={editingSlot}
//       />
//     </div>
//   );
// };

// export default SlotPage;















































// src/pages/instructor/slot/SlotPage.tsx
// src/pages/instructor/slot/SlotPage.tsx
import { useEffect, useState } from "react";
import {
  listSlots,
  deleteSlot,
  deleteUnbookedSlotsForDate,
} from "../../../api/action/InstructorActionApi";
import { format, startOfWeek, addDays } from "date-fns";
import { toast } from "react-toastify";
import { PlusCircle, Trash2, Pencil } from "lucide-react";
import SlotModal from "../../../components/InstructorComponents/SlotModal";
import { useNavigate } from "react-router-dom";
import type { SlotDTO } from "../../../components/InstructorComponents/interface/instructorComponentInterface";

const SlotPage = () => {
  const [slots, setSlots] = useState<SlotDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStartDate, setWeekStartDate] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  const [editingSlot, setEditingSlot] = useState<{
    slotId: string;
    startTimeUTC: string;
    endTimeUTC: string;
    startTime: string;
    endTime: string;
    price: number;
  } | undefined>(undefined);

  const navigate = useNavigate();

  const fetchSlots = async (date?: Date) => {
    try {
      const formattedDate = date
        ? format(date, "yyyy-MM-dd")
        : format(selectedDate, "yyyy-MM-dd");
      const response = await listSlots(formattedDate);
      setSlots(response.slots || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch slots");
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlot(slotId);
      toast.success("Slot deleted");
      fetchSlots(selectedDate);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete slot");
    }
  };

  const handleDeleteUnbookedSlots = async () => {
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      await deleteUnbookedSlotsForDate(formattedDate);
      toast.success("All unbooked slots deleted for the date");
      fetchSlots(selectedDate);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete unbooked slots");
    }
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingSlot(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot: SlotDTO) => {
    setModalMode("edit");
    setEditingSlot({
      slotId: slot.slotId,
      startTimeUTC: slot.startTimeUTC,
      endTimeUTC: slot.endTimeUTC,
      startTime: slot.startTime,
      endTime: slot.endTime,
      price: slot.price,
    });
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

  const handleModalSuccess = () => {
    fetchSlots(selectedDate);
    setIsModalOpen(false);
    setEditingSlot(undefined);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Time Slots</h2>
        <button
          onClick={() => navigate("/instructor/slotsHistory")}
          className="text-sm text-blue-600 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition"
        >
          View Slot History
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={goToPreviousWeek}
          className="text-blue-600 hover:underline font-medium"
        >
          ← Previous Week
        </button>
        <span className="text-lg font-semibold text-gray-700">
          {format(weekStartDate, "MMM d")} - {format(weekEndDate, "MMM d, yyyy")}
        </span>
        <button
          onClick={goToNextWeek}
          className="text-blue-600 hover:underline font-medium"
        >
          Next Week →
        </button>
      </div>

      {/* Day Selector */}
      <div className="grid grid-cols-7 gap-3 mb-8">
        {[...Array(7)].map((_, i) => {
          const day = addDays(weekStartDate, i);
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
          const isSelected = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(day)}
              className={`p-4 rounded-xl text-center transition-all border-2 ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-700 shadow-lg"
                  : isToday
                  ? "bg-indigo-100 border-indigo-400 text-indigo-800 font-bold"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="text-2xl font-bold">{format(day, "d")}</div>
              <div className="text-sm">{format(day, "EEE")}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Date Header */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {format(selectedDate, "EEEE, MMMM d, yyyy")}
      </h3>

      {/* Slots Display */}
      <div className="flex flex-wrap gap-3 mb-8 min-h-[60px]">
        {slots.length > 0 ? (
          slots.map((slot) => (
            <div
              key={slot.slotId}
              className={`flex items-center gap-3 px-5 py-3 rounded-full text-sm font-medium border transition-all
                ${slot.isBooked
                  ? "bg-red-100 text-red-700 border-red-300 cursor-pointer hover:bg-red-200"
                  : "bg-emerald-100 text-emerald-700 border-emerald-300"
                }`}
              onClick={() => slot.isBooked && navigate(`/instructor/slots/${slot.slotId}`)}
            >
              <span className="font-semibold">
                {slot.startTime} - {slot.endTime}
              </span>
              <span className="text-xs">• ₹{slot.price}</span>

              {!slot.isBooked && (
                <div className="flex gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenEditModal(slot)}
                    className="p-1.5 hover:bg-blue-200 rounded transition"
                    title="Edit slot"
                  >
                    <Pencil className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteSlot(slot.slotId)}
                    className="p-1.5 hover:bg-red-200 rounded transition"
                    title="Delete slot"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">No slots available for this date</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-md"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Slot
        </button>

        {slots.length > 0 && (
          <button
            onClick={handleDeleteUnbookedSlots}
            className="flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-red-700 transition shadow-md"
          >
            <Trash2 className="w-5 h-5" />
            Delete All Unbooked Slots
          </button>
        )}
      </div>

      {/* Modal */}
      <SlotModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSlot(undefined);
        }}
        mode={modalMode}
        selectedDate={selectedDate}
        onSuccess={handleModalSuccess}
        initialData={editingSlot}
      />
    </div>
  );
};

export default SlotPage;