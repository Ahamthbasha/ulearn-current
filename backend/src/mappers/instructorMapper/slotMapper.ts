import { ISlot } from "../../models/slotModel";
import { SlotDTO } from "../../dto/instructorDTO/slotDTO";
import { formatInTimeZone } from "date-fns-tz";

const IST_TIMEZONE = "Asia/Kolkata";

export const mapSlotToDTO = (slot: ISlot): SlotDTO => {
  const startUTC = slot.startTime;
  const endUTC = slot.endTime;

  return {
    slotId: slot._id.toString(),
    instructorId: slot.instructorId.toString(),
    startTimeUTC: startUTC.toISOString(), 
    endTimeUTC: endUTC.toISOString(),
    startTime: formatInTimeZone(startUTC, IST_TIMEZONE, "h:mm a"),
    endTime: formatInTimeZone(endUTC, IST_TIMEZONE, "h:mm a"),
    price: slot.price,
    isBooked: slot.isBooked,
  };
};

export const mapSlotsToDTO = (slots: ISlot[]): SlotDTO[] => {
  return slots.map(mapSlotToDTO);
};