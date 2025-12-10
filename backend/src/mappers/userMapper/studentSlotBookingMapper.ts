import { IBooking } from "../../models/bookingModel";
import { StudentSlotBookingHistoryDTO } from "../../dto/userDTO/StudentSlotBookingHistoryDTO";
import { formatInTimeZone } from "date-fns-tz";

const IST = "Asia/Kolkata";

function isPopulatedSlot(slot: any): slot is { startTime: Date; endTime: Date; price: number } {
  return slot && typeof slot === "object" && "startTime" in slot && slot.startTime instanceof Date;
}

export const toStudentSlotBookingHistoryDTO = (
  booking: IBooking & { slotId: any }
): StudentSlotBookingHistoryDTO => {
  if (!isPopulatedSlot(booking.slotId)) {
    throw new Error("slotId is not populated");
  }

  const slot = booking.slotId;

  return {
    orderId: booking._id.toString(),
    date: formatInTimeZone(slot.startTime, IST, "dd-MM-yyyy"),
    startTime: formatInTimeZone(slot.startTime, IST, "h:mm a").toLowerCase(),
    endTime: formatInTimeZone(slot.endTime, IST, "h:mm a").toLowerCase(),
    price: slot.price,
    status: booking.status,
  };
};