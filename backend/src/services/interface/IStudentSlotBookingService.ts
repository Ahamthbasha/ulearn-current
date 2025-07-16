import { IBooking } from "../../models/bookingModel";
import { ISlot } from "../../models/slotModel";
import { IInstructor } from "../../models/instructorModel";

export interface IStudentSlotBookingService {
  initiateCheckout(
    slotId: string,
    studentId: string
  ): Promise<{
    booking: {
      slotId: ISlot;
      instructorId: IInstructor;
    };
    razorpayOrder: any;
  }>;

  verifyPayment(
    slotId: string,
    studentId: string,
    razorpayPaymentId: string
  ): Promise<IBooking>;

  bookViaWallet(slotId: string, studentId: string): Promise<IBooking>;

  getStudentBookingHistoryPaginated(
  studentId: string,
  page: number,
  limit: number
): Promise<{ data: IBooking[]; total: number }>;


  getStudentBookingById(bookingId: string): Promise<IBooking | null>;
}
