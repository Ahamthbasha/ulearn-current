import { IStudentSlotBookingController } from "./interfaces/IStudentSlotBookingController";
import { IStudentSlotBookingService } from "../../services/studentServices/interface/IStudentSlotBookingService";
import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { PopulatedBooking } from "../../types/PopulatedBooking";
import { generateSlotReceiptPdf } from "../../utils/generateSlotReceiptPdf";
import {
  StudentErrorMessages,
  StudentSuccessMessages,
} from "../../utils/constants";

export class StudentSlotBookingController
  implements IStudentSlotBookingController
{
  private _bookingService: IStudentSlotBookingService;

  constructor(bookingService: IStudentSlotBookingService) {
    this._bookingService = bookingService;
  }

  async initiateCheckout(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { slotId } = req.params;
      const studentId = req.user?.id;
      if (!studentId) throw new Error("Unauthorized");

      const result = await this._bookingService.initiateCheckout(
        slotId,
        studentId,
      );
      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (err: any) {
      console.error("initiateCheckout error:", err);

      if (
        err.message.startsWith(StudentErrorMessages.PENDING_BOOKING_EXISTS_SLOT)
      ) {
        const bookingId = err.message.split(":")[1];
        res.status(StatusCode.CONFLICT).json({
          success: false,
          error: StudentErrorMessages.PENDING_BOOKING_EXISTS_MESSAGE,
          message: StudentErrorMessages.PENDING_BOOKING_INFO,
          bookingId: bookingId,
          actions: {
            cancel: `/api/student/bookings/${bookingId}/cancel`,
          },
        });
        return;
      } else if (
        err.message === StudentErrorMessages.PENDING_BOOKING_BY_OTHERS
      ) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          error: StudentErrorMessages.PENDING_BOOKING_BY_OTHERS_ERROR_MSG,
          message: StudentErrorMessages.ANOTHER_USER_PROCESSING,
        });
        return;
      } else if (err.message === StudentErrorMessages.SLOT_ALREADY_BOOKED_MSG) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          error: StudentErrorMessages.SLOT_ALREADY_BOOKED_ERROR_MSG,
          message: StudentErrorMessages.SLOT_ALREADY_BOOKED_MESSAGE,
        });
        return;
      }

      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || StudentErrorMessages.CHECKOUT_FAILED,
      });
    }
  }

  async checkSlotAvailability(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { slotId } = req.params;
      const studentId = req.user?.id;
      if (!studentId) throw new Error("Unauthorized");

      const availability =
        await this._bookingService.checkSlotAvailabilityForStudent(
          slotId,
          studentId,
        );

      res.status(StatusCode.OK).json({
        success: true,
        ...availability,
      });
    } catch (err: any) {
      console.error("checkSlotAvailability error:", err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message:
          err.message || StudentErrorMessages.FAILED_TO_CHECK_SLOT_AVAILABILITY,
      });
    }
  }

  async cancelPendingBooking(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { bookingId } = req.params;
      const studentId = req.user?.id;
      if (!studentId) throw new Error("Unauthorized");

      const cancelled = await this._bookingService.cancelPendingBooking(
        bookingId,
        studentId,
      );

      if (cancelled) {
        res.status(StatusCode.OK).json({
          success: true,
          message: StudentSuccessMessages.PENDING_BOOKING_CANCELLED,
        });
      } else {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: StudentErrorMessages.FAILED_TO_CANCEL_PENDING_BOOKING,
        });
      }
    } catch (err: any) {
      console.error("cancelPendingBooking error:", err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message:
          err.message || StudentErrorMessages.FAILED_TO_CANCEL_PENDING_BOOKING,
      });
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
        razorpay_payment_id,
      );
      res.status(StatusCode.CREATED).json({ success: true, booking });
    } catch (err: any) {
      console.error("verifyPayment error:", err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || StudentErrorMessages.PAYMENT_FAILED,
      });
    }
  }

  async verifyRetryPayment(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { bookingId, razorpay_payment_id } = req.body ?? {};
      const studentId = req.user?.id;
      if (!studentId) throw new Error("Unauthorized");
      if (!bookingId || !razorpay_payment_id)
        throw new Error("Missing payment details");

      const booking = await this._bookingService.verifyRetryPayment(
        bookingId,
        studentId,
        razorpay_payment_id,
      );
      res.status(StatusCode.CREATED).json({ success: true, booking });
    } catch (err: any) {
      console.error("verifyRetryPayment error:", err);

      if (err.message === StudentErrorMessages.SLOT_BOOKED_BY_OTHERS) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          error: StudentErrorMessages.SLOT_ALREADY_BOOKED_CONFIRM,
          message: StudentErrorMessages.SLOT_BOOKED_BY_OTHERS_MSG,
        });
        return;
      }

      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message:
          err.message || StudentErrorMessages.PAYMENT_VERIFICATION_FAILED,
      });
    }
  }

  async bookViaWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { slotId } = req.params;
      const studentId = req.user?.id;
      if (!studentId) throw new Error("Unauthorized");

      const booking = await this._bookingService.bookViaWallet(
        slotId,
        studentId,
      );
      res.status(StatusCode.CREATED).json({ success: true, booking });
    } catch (err: any) {
      console.error("bookViaWallet error:", err);

      if (
        err.message.startsWith(StudentErrorMessages.PENDING_BOOKING_EXISTS_SLOT)
      ) {
        const bookingId = err.message.split(":")[1];
        res.status(StatusCode.CONFLICT).json({
          success: false,
          error: StudentErrorMessages.PENDING_BOOKING_EXISTS_MESSAGE,
          message: StudentErrorMessages.PENDING_BOOKING_INFO,
          bookingId: bookingId,
          actions: {
            cancel: `/api/bookings/${bookingId}/cancel`,
            checkStatus: `/api/bookings/${bookingId}/status`,
          },
        });
        return;
      } else if (
        err.message === StudentErrorMessages.PENDING_BOOKING_BY_OTHERS
      ) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          error: StudentErrorMessages.PENDING_BOOKING_BY_OTHERS_ERROR_MSG,
          message: StudentErrorMessages.ANOTHER_USER_PROCESSING,
        });
        return;
      } else if (err.message === StudentErrorMessages.SLOT_ALREADY_BOOKED_MSG) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          error: StudentErrorMessages.SLOT_ALREADY_BOOKED_ERROR_MSG,
          message: StudentErrorMessages.SLOT_ALREADY_BOOKED_MESSAGE,
        });
        return;
      }

      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || StudentErrorMessages.PAYMENT_FAILED,
      });
    }
  }

  async getBookingHistory(
    req: AuthenticatedRequest,
    res: Response,
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
          searchQuery,
        );

      res.status(StatusCode.OK).json({
        success: true,
        data: result.data,
        total: result.total,
      });
    } catch (err: any) {
      console.error("getBookingHistory error:", err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || StudentErrorMessages.FAILED_TO_FETCH_BOOKINGS,
      });
    }
  }

  async getBookingDetail(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const bookingId = req.params.bookingId;
      if (!bookingId) throw new Error("Booking ID is required");

      const bookingDetail =
        await this._bookingService.getStudentBookingDetail(bookingId);

      if (!bookingDetail) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: StudentErrorMessages.BOOKING_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({ success: true, data: bookingDetail });
    } catch (err: any) {
      console.error("getBookingDetail error:", err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || StudentErrorMessages.FAILED_TO_FETCH_BOOKING,
      });
    }
  }

  async downloadReceipt(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const bookingId = req.params.bookingId;
      if (!bookingId) throw new Error("Booking ID is required");

      const booking =
        await this._bookingService.getStudentBookingById(bookingId);
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
        `attachment; filename=slot-receipt-${bookingId}.pdf`,
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

  async handlePaymentFailure(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { bookingId } = req.params;
      const studentId = req.user?.id;
      if (!studentId) throw new Error("Unauthorized");
      if (!bookingId) throw new Error("Booking ID is required");

      console.log("handle paymet failure", bookingId);

      await this._bookingService.handlePaymentFailure(bookingId, studentId);
      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.BOOKING_MARKED_AS_FAILED,
      });
    } catch (err: any) {
      console.error("handlePaymentFailure error:", err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message:
          err.message || StudentErrorMessages.FAILED_TO_MARK_BOOKING_AS_FAILED,
      });
    }
  }

  async retryPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const studentId = req.user?.id;
      if (!studentId) throw new Error("Unauthorized");
      if (!bookingId) throw new Error("Booking ID is required");

      const result = await this._bookingService.retryPayment(
        bookingId,
        studentId,
      );
      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (err: any) {
      console.error("retryPayment error:", err);

      if (err.message === StudentErrorMessages.PENDING_BOOKING_BY_OTHERS) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          error: StudentErrorMessages.PENDING_BOOKING_BY_OTHERS_ERROR_MSG,
          message: StudentErrorMessages.ANOTHER_USER_PROCESSING,
        });
        return;
      } else if (err.message === StudentErrorMessages.SLOT_ALREADY_BOOKED_MSG) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          error: StudentErrorMessages.SLOT_ALREADY_BOOKED_ERROR_MSG,
          message: StudentErrorMessages.SLOT_ALREADY_BOOKED_MESSAGE,
        });
        return;
      }

      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || StudentErrorMessages.SLOT_RETRY_PAYMENT_FAILED,
      });
    }
  }
}
