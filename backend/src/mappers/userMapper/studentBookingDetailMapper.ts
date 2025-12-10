import { PopulatedBooking } from "../../types/PopulatedBooking";
import { StudentBookingDetailDTO } from "../../dto/userDTO/studentBookingDetailDTO";
import { formatInTimeZone } from "date-fns-tz";

const IST = "Asia/Kolkata";


export const toStudentBookingDetailDTO = (
  booking: PopulatedBooking
): StudentBookingDetailDTO => {
  const student = typeof booking.studentId === "object" ? booking.studentId : null;
  const instructor = typeof booking.instructorId === "object" ? booking.instructorId : null;
  const slot = typeof booking.slotId === "object" ? booking.slotId : null;

  if (!slot || !slot.startTime || !slot.endTime) {
    throw new Error("Slot not properly populated");
  }

  return {
    studentName: student?.username || "N/A",
    studentEmail: student?.email || "N/A",
    instructorName: instructor?.username || "N/A",
    instructorEmail: instructor?.email || "N/A",

    bookingStatus: booking.status || "unknown",
    bookingId: booking._id.toString(),
    bookedDateTime: formatInTimeZone(booking.createdAt, IST, "dd-MM-yyyy 'at' h:mm a"),

    slotId: slot._id?.toString() || "N/A",
    slotDate: formatInTimeZone(slot.startTime, IST, "dd-MM-yyyy"),
    startTime: formatInTimeZone(slot.startTime, IST, "h:mm a"),
    endTime: formatInTimeZone(slot.endTime, IST, "h:mm a"),

    price: slot.price || 0,
    txnId: booking.txnId || "N/A",
  };
};