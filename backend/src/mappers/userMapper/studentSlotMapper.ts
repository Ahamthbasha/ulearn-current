// import { ISlot } from "../../models/slotModel";
// import { StudentSlotDTO } from "../../dto/userDTO/studentSlotDTO";

// export const mapToSlotDTO = (slot: ISlot): StudentSlotDTO => {
//   const formatTime = (date: Date): string => {
//     return date
//       .toLocaleTimeString("en-US", {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//       })
//       .toLowerCase();
//   };

//   return {
//     slotId: slot._id.toString(),
//     instructorId: slot.instructorId.toString(),
//     startTime: formatTime(new Date(slot.startTime)),
//     endTime: formatTime(new Date(slot.endTime)),
//     price: slot.price,
//     isBooked: slot.isBooked,
//   };
// };

// export const groupSlotsByDate = (
//   slots: ISlot[],
// ): Record<string, StudentSlotDTO[]> => {
//   const grouped: Record<string, StudentSlotDTO[]> = {};
//   slots.forEach((slot) => {
//     const dateKey = new Date(slot.startTime).toLocaleDateString("en-US", {
//       weekday: "long",
//       month: "long",
//       day: "numeric",
//       year: "numeric",
//     });
//     if (!grouped[dateKey]) grouped[dateKey] = [];
//     grouped[dateKey].push(mapToSlotDTO(slot));
//   });
//   return grouped;
// };




















// src/mappers/userMapper/studentSlotMapper.ts
import { ISlot } from "../../models/slotModel";
import { StudentSlotDTO } from "../../dto/userDTO/studentSlotDTO";
import { formatInTimeZone } from "date-fns-tz";

const IST = "Asia/Kolkata";

export const mapToSlotDTO = (slot: ISlot): StudentSlotDTO => {
  return {
    slotId: slot._id.toString(),
    instructorId: slot.instructorId.toString(),
    startTime: formatInTimeZone(slot.startTime, IST, "h:mm a"), // e.g., 3:00 pm
    endTime: formatInTimeZone(slot.endTime, IST, "h:mm a"),
    price: slot.price,
    isBooked: slot.isBooked,
  };
};

export const groupSlotsByDate = (
  slots: ISlot[],
): Record<string, StudentSlotDTO[]> => {
  const grouped: Record<string, StudentSlotDTO[]> = {};

  slots.forEach((slot) => {
    const dateKey = formatInTimeZone(
      slot.startTime,
      IST,
      "EEEE, MMMM d, yyyy" // e.g., "Monday, November 17, 2025"
    );

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(mapToSlotDTO(slot));
  });

  // Sort dates chronologically
  return Object.keys(grouped)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .reduce((acc, key) => {
      acc[key] = grouped[key];
      return acc;
    }, {} as Record<string, StudentSlotDTO[]>);
};