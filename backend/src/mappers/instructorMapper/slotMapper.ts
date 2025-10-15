import { ISlot } from "../../models/slotModel";
import { format } from "date-fns";
import {SlotDTO} from "../../dto/instructorDTO/slotDTO"

export const mapSlotToDTO = (slot: ISlot): SlotDTO => {
  return {
    slotId: slot._id.toString(),
    instructorId: slot.instructorId.toString(),
    startTime: format(slot.startTime, "h:mm a"),
    endTime: format(slot.endTime, "h:mm a"),
    price: slot.price,
    isBooked: slot.isBooked,
  };
};

export const mapSlotsToDTO = (slots: ISlot[]): SlotDTO[] => {
  return slots.map(mapSlotToDTO);
};