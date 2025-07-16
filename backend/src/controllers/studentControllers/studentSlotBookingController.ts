import { IStudentSlotBookingController } from "./interfaces/IStudentSlotBookingController";
import { IStudentSlotBookingService } from "../../services/interface/IStudentSlotBookingService";
import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/AuthenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { PopulatedBooking } from "../../types/PopulatedBooking";
import { generateSlotReceiptPdf } from "../../utils/generateSlotReceiptPdf";

export class StudentSlotBookingController
  implements IStudentSlotBookingController
{
  constructor(private bookingService: IStudentSlotBookingService) {}

  async initiateCheckout(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { slotId } = req.params;
      const studentId = req.user?.id;
      if (!studentId) throw new Error("Unauthorized");

      const result = await this.bookingService.initiateCheckout(
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

      const booking = await this.bookingService.verifyPayment(
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

      const booking = await this.bookingService.bookViaWallet(
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

      const result =
        await this.bookingService.getStudentBookingHistoryPaginated(
          studentId,
          page,
          limit
        );

      res.status(StatusCode.OK).json({ success: true, ...result });
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

      const booking = await this.bookingService.getStudentBookingById(
        bookingId
      );
      if (!booking) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ success: false, message: "Booking not found" });
        return;
      }

      res.status(StatusCode.OK).json({ success: true, data: booking });
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

      const booking = await this.bookingService.getStudentBookingById(
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
        message: err.message || "Failed to generate receipt",
      });
    }
  }
}
