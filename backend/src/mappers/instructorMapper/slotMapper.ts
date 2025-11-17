// import { ISlot } from "../../models/slotModel";
// import { format } from "date-fns";
// import { SlotDTO } from "../../dto/instructorDTO/slotDTO";

// export const mapSlotToDTO = (slot: ISlot): SlotDTO => {
//   return {
//     slotId: slot._id.toString(),
//     instructorId: slot.instructorId.toString(),
//     startTime: format(slot.startTime, "h:mm a"),
//     endTime: format(slot.endTime, "h:mm a"),
//     price: slot.price,
//     isBooked: slot.isBooked,
//   };
// };

// export const mapSlotsToDTO = (slots: ISlot[]): SlotDTO[] => {
//   return slots.map(mapSlotToDTO);
// };












import { ISlot } from "../../models/slotModel";
import { SlotDTO } from "../../dto/instructorDTO/slotDTO";
import { formatInTimeZone } from "date-fns-tz";

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * BEST PRACTICE: Send UTC ISO + display string separately
 * This prevents all timezone bugs forever
 */
export const mapSlotToDTO = (slot: ISlot): SlotDTO => {
  const startUTC = slot.startTime;
  const endUTC = slot.endTime;

  return {
    slotId: slot._id.toString(),
    instructorId: slot.instructorId.toString(),

    // 1. Send raw UTC ISO (for accurate parsing)
    startTimeUTC: startUTC.toISOString(), // e.g. "2025-11-17T09:30:00.000Z"
    endTimeUTC: endUTC.toISOString(),

    // 2. Send human-readable IST time (safe to display directly)
    startTime: formatInTimeZone(startUTC, IST_TIMEZONE, "h:mm a"), // "3:00 PM"
    endTime: formatInTimeZone(endUTC, IST_TIMEZONE, "h:mm a"),     // "4:00 PM"

    price: slot.price,
    isBooked: slot.isBooked,
  };
};

export const mapSlotsToDTO = (slots: ISlot[]): SlotDTO[] => {
  return slots.map(mapSlotToDTO);
};