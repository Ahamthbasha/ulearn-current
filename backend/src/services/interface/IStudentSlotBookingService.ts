import { IBooking } from "../../models/bookingModel";

export interface IStudentSlotBookingService {
  initiateCheckout(slotId: string, studentId: string): Promise<{ booking: IBooking; razorpayOrder: any }>;
  updatePaymentStatus(bookingId: string, status: "paid" | "failed", txnId: string): Promise<void>;
  bookViaWallet(slotId: string, studentId: string): Promise<IBooking>;

  getStudentBookingHistory(studentId: string): Promise<IBooking[]>;
  getStudentBookingById(bookingId: string): Promise<IBooking | null>;

}
