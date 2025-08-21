import { format } from "date-fns";
import { PopulatedBooking } from "../../types/PopulatedBooking"; 
import { StudentBookingDetailDTO } from "../../dto/userDTO/studentBookingDetailDTO"; 

export const toStudentBookingDetailDTO = (booking: PopulatedBooking): StudentBookingDetailDTO => {
  // Safely access nested properties with type guards
  const student = typeof booking.studentId === 'object' ? booking.studentId : null;
  const instructor = typeof booking.instructorId === 'object' ? booking.instructorId : null;
  const slot = typeof booking.slotId === 'object' ? booking.slotId : null;

  return {
    // Student Information
    studentName: student?.username || 'N/A',
    studentEmail: student?.email || 'N/A',
    
    // Instructor Information
    instructorName: instructor?.username || 'N/A',
    instructorEmail: instructor?.email || 'N/A',
    
    // Booking Information
    bookingStatus: booking.status || 'unknown',
    bookingId: booking._id.toString(),
    bookedDateTime: format(new Date(booking.createdAt), "dd-MM-yyyy 'at' hh:mm a"),
    
    // Slot Information
    slotId: slot?._id?.toString() || 'N/A',
    slotDate: slot?.startTime ? format(new Date(slot.startTime), "dd-MM-yyyy") : 'N/A',
    startTime: slot?.startTime ? format(new Date(slot.startTime), "hh:mm a") : 'N/A',
    endTime: slot?.endTime ? format(new Date(slot.endTime), "hh:mm a") : 'N/A',
    
    // Payment Information
    price: slot?.price || 0,
    txnId: booking.txnId || 'N/A',
  };
};
