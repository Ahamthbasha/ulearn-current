import { IStudentSlotBookingController } from "./interfaces/IStudentSlotBookingController";
import { IStudentSlotBookingService } from "../../services/studentServices/interface/IStudentSlotBookingService"; 
import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { PopulatedBooking } from "../../types/PopulatedBooking";
import { generateSlotReceiptPdf } from "../../utils/generateSlotReceiptPdf";
import { StudentErrorMessages } from "../../utils/constants";

export class StudentSlotBookingController
  implements IStudentSlotBookingController
{
  private _bookingService : IStudentSlotBookingService
  constructor(bookingService: IStudentSlotBookingService) {
    this._bookingService = bookingService
  }

  async initiateCheckout(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { slotId } = req.params;
      const studentId = req.user?.id;
      if (!studentId) throw new Error("Unauthorized");

      const result = await this._bookingService.initiateCheckout(
        slotId,
        studentId
      );
      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (err: any) {
      console.error("initiateCheckout error:", err);
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: err.message });
    }
  }

  async verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { slotId, razorpay_payment_id } = req.body ?? {};
      const studentId = req.user?.id;
      if (!studentId) throw new Error("Unauthorized");

      if (!slotId || !razorpay_payment_id)
        throw new Error("Missing payment details");

      const booking = await this._bookingService.verifyPayment(
        slotId,
        studentId,
        razorpay_payment_id
      );
      res.status(StatusCode.CREATED).json({ success: true, booking });
    } catch (err: any) {
      console.error("verifyPayment error:", err);
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: err.message });
    }
  }

  async bookViaWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { slotId } = req.params;
      const studentId = req.user?.id;
      if (!studentId) throw new Error("Unauthorized");

      const booking = await this._bookingService.bookViaWallet(
        slotId,
        studentId
      );
      res.status(StatusCode.CREATED).json({ success: true, booking });
    } catch (err: any) {
      console.error("bookViaWallet error:", err);
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: err.message });
    }
  }

  async getBookingHistory(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw new Error("Unauthorized");

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const searchQuery = req.query.search as string;

      const result =
        await this._bookingService.getStudentBookingHistoryPaginated(
          studentId,
          page,
          limit,
          searchQuery
        );

      res.status(StatusCode.OK).json({
        success: true,
        data: result.data,
        total: result.total
      });
    } catch (err: any) {
      console.error("getBookingHistory error:", err);
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: err.message });
    }
  }

  async getBookingDetail(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const bookingId = req.params.bookingId;
      if (!bookingId) throw new Error("Booking ID is required");

      const bookingDetail = await this._bookingService.getStudentBookingDetail(
        bookingId
      );
      
      if (!bookingDetail) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ success: false, message: StudentErrorMessages.BOOKING_NOT_FOUND });
        return;
      }

      res.status(StatusCode.OK).json({ success: true, data: bookingDetail });
    } catch (err: any) {
      console.error("getBookingDetail error:", err);
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: err.message });
    }
  }

  async downloadReceipt(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const bookingId = req.params.bookingId;
      if (!bookingId) throw new Error("Booking ID is required");

      const booking = await this._bookingService.getStudentBookingById(
        bookingId
      );
      if (
        !booking ||
        typeof booking.slotId === "string" ||
        typeof booking.instructorId === "string" ||
        typeof booking.studentId === "string"
      ) {
        throw new Error("Booking is not fully populated");
      }

      const populatedBooking = booking as PopulatedBooking;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=slot-receipt-${bookingId}.pdf`
      );
      generateSlotReceiptPdf(res, populatedBooking);
    } catch (err: any) {
      console.error("downloadReceipt error:", err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || StudentErrorMessages.FAILED_TO_GENERATE_RECEIPT,
      });
    }
  }
}