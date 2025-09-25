import { IBooking } from "../../../models/bookingModel";
import { ISlot } from "../../../models/slotModel";
import { IInstructor } from "../../../models/instructorModel";
import { StudentSlotBookingHistoryDTO } from "../../../dto/userDTO/StudentSlotBookingHistoryDTO";
import { StudentBookingDetailDTO } from "../../../dto/userDTO/studentBookingDetailDTO";
import { SlotAvailabilityResult } from "../../../types/ISlotAvailabilityResult";

export interface IStudentSlotBookingService {
  initiateCheckout(
    slotId: string,
    studentId: string,
  ): Promise<{
    booking: {
      slotId: ISlot;
      instructorId: IInstructor;
      bookingId: string;
    };
    razorpayOrder: any;
  }>;

  verifyPayment(
    slotId: string,
    studentId: string,
    razorpayPaymentId: string,
  ): Promise<IBooking>;

  verifyRetryPayment(
    bookingId: string,
    studentId: string,
    razorpayPaymentId: string,
  ): Promise<IBooking>;

  bookViaWallet(slotId: string, studentId: string): Promise<IBooking>;

  getStudentBookingHistoryPaginated(
    studentId: string,
    page: number,
    limit: number,
    searchQuery?: string,
  ): Promise<{ data: StudentSlotBookingHistoryDTO[]; total: number }>;

  getStudentBookingById(bookingId: string): Promise<IBooking | null>;

  getStudentBookingDetail(
    bookingId: string,
  ): Promise<StudentBookingDetailDTO | null>;

  cancelPendingBooking(bookingId: string, studentId: string): Promise<boolean>;

  checkSlotAvailabilityForStudent(
    slotId: string,
    studentId: string,
  ): Promise<SlotAvailabilityResult>;

  handlePaymentFailure(bookingId: string, studentId: string): Promise<void>;

  retryPayment(
    bookingId: string,
    studentId: string,
  ): Promise<{
    booking: {
      slotId: ISlot;
      instructorId: IInstructor;
      bookingId: string;
    };
    razorpayOrder: any;
  }>;
}
