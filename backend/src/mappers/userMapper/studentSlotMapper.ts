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
      "EEEE, MMMM d, yyyy"
    );

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(mapToSlotDTO(slot));
  });

  return Object.keys(grouped)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .reduce((acc, key) => {
      acc[key] = grouped[key];
      return acc;
    }, {} as Record<string, StudentSlotDTO[]>);
};