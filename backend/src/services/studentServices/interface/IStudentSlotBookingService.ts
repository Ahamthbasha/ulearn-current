import { IBooking } from "../../../models/bookingModel";
import { ISlot } from "../../../models/slotModel";
import { IInstructor } from "../../../models/instructorModel";
import { StudentSlotBookingHistoryDTO } from "../../../dto/userDTO/StudentSlotBookingHistoryDTO";
import { StudentBookingDetailDTO } from "../../../dto/userDTO/studentBookingDetailDTO";

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
    limit: number,
    searchQuery?: string
  ): Promise<{ data: StudentSlotBookingHistoryDTO[]; total: number }>;

  getStudentBookingById(bookingId: string): Promise<IBooking | null>;
  
  getStudentBookingDetail(bookingId: string): Promise<StudentBookingDetailDTO | null>;
}