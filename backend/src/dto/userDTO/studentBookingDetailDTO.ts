export interface StudentBookingDetailDTO {
  studentName: string;
  studentEmail: string;
  instructorName: string;
  instructorEmail: string;
  bookingStatus: string;
  bookingId: string;
  bookedDateTime: string;
  slotId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  price: number;
  txnId: string;
}
