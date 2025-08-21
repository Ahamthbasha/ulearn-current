export interface StudentBookingDetailDTO {
  // Student Information
  studentName: string;
  studentEmail: string;
  
  // Instructor Information
  instructorName: string;
  instructorEmail: string;
  
  // Booking Information
  bookingStatus: string;
  bookingId: string;
  bookedDateTime: string; // When the booking was made
  
  // Slot Information
  slotId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  
  // Payment Information
  price: number;
  txnId: string;
}
