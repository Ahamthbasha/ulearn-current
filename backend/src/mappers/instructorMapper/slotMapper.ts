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
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { SlotDTO } from "../../dto/instructorDTO/slotDTO";

const IST_TIMEZONE = "Asia/Kolkata";

export const mapSlotToDTO = (slot: ISlot): SlotDTO => {
  // Convert UTC times to IST
  const startTimeIST = toZonedTime(slot.startTime, IST_TIMEZONE);
  const endTimeIST = toZonedTime(slot.endTime, IST_TIMEZONE);

  return {
    slotId: slot._id.toString(),
    instructorId: slot.instructorId.toString(),
    startTime: format(startTimeIST, "h:mm a"), // 12-hour format with AM/PM
    endTime: format(endTimeIST, "h:mm a"),
    price: slot.price,
    isBooked: slot.isBooked,
  };
};

export const mapSlotsToDTO = (slots: ISlot[]): SlotDTO[] => {
  return slots.map(mapSlotToDTO);
};