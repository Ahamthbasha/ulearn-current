import { IStudentSlotBookingController } from "./interfaces/IStudentSlotBookingController";
import { IStudentSlotBookingService } from "../../services/interface/IStudentSlotBookingService";
import { Request, Response } from "express";
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
      const studentId = req.user?.id; // assuming you attach user in middleware

      if (!studentId) throw new Error("Unauthorized");

      const { booking, razorpayOrder } =
        await this.bookingService.initiateCheckout(slotId, studentId);

      res.status(StatusCode.CREATED).json({
        success: true,
        booking,
        razorpayOrder,
      });
    } catch (err: any) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: err.message });
    }
  }

  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId, status, txnId } = req.body;

      if (!bookingId || !txnId || !status) {
        throw new Error("Missing payment verification data");
      }

      await this.bookingService.updatePaymentStatus(bookingId, status, txnId);

      res
        .status(StatusCode.OK)
        .json({ success: true, message: "Payment updated successfully" });
    } catch (err: any) {
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

      const bookings = await this.bookingService.getStudentBookingHistory(
        studentId
      );
      res.status(StatusCode.OK).json({ success: true, data: bookings });
    } catch (err: any) {
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
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: err.message });
    }
  }

  async downloadReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const bookingId = req.params.bookingId;
    if (!bookingId) throw new Error("Booking ID is required");

    const booking = await this.bookingService.getStudentBookingById(bookingId);

    if (
      !booking ||
      typeof booking.slotId === "string" ||
      typeof booking.instructorId === "string" ||
      typeof booking.studentId === "string"
    ) {
      throw new Error("Booking is not fully populated");
    }

    // ✅ Fully typed, no 'any'
    const populatedBooking = booking as PopulatedBooking;

    generateSlotReceiptPdf(res, populatedBooking);
  } catch (err: any) {
    res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: err.message || "Failed to generate receipt",
    });
  }
}

}
