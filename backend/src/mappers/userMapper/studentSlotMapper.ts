import { ISlot } from "../../models/slotModel";
import { StudentSlotDTO } from "../../dto/userDTO/studentSlotDTO"; 

export const mapToSlotDTO = (slot: ISlot): StudentSlotDTO => {
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();
  };

  return {
    slotId: slot._id.toString(),
    instructorId: slot.instructorId.toString(),
    startTime: formatTime(new Date(slot.startTime)),
    endTime: formatTime(new Date(slot.endTime)),
    price: slot.price,
    isBooked: slot.isBooked,
  };
};

export const groupSlotsByDate = (slots: ISlot[]): Record<string, StudentSlotDTO[]> => {
  const grouped: Record<string, StudentSlotDTO[]> = {};
  slots.forEach((slot) => {
    const dateKey = new Date(slot.startTime).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(mapToSlotDTO(slot));
  });
  return grouped;
};