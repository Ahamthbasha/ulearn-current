import { Response } from "express";
import { IInstructorMembershipOrderController } from "./interfaces/IInstructorMembershipOrderController";
import { IInstructorMembershipOrderService } from "../../services/instructorServices/interface/IInstructorMembershipOrderService";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { IInstructorMembershipService } from "../../services/instructorServices/interface/IInstructorMembershipService";
import {
  INSTRUCTOR_ERROR_MESSAGE,
  INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE,
  INSTRUCTOR_MEMBERSHIP_ORDER_SUCCESS_MESSAGE,
  ResponseMessages,
} from "../../utils/constants";
import { generateMembershipReceiptPdf } from "../../utils/generateMembershipReceiptPdf";

export class InstructorMembershipOrderController
  implements IInstructorMembershipOrderController
{
  private _instructorMembershipOrderService: IInstructorMembershipOrderService;
  private _instructorMembershipService: IInstructorMembershipService;

  constructor(
    instructorMembershipOrderService: IInstructorMembershipOrderService,
    instructorMembershipService: IInstructorMembershipService
  ) {
    this._instructorMembershipOrderService = instructorMembershipOrderService;
    this._instructorMembershipService = instructorMembershipService;
  }

  async initiateCheckout(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { planId } = req.params;
      const instructorId = req.user?.id;

      if (!planId || !instructorId) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      const instructor =
        await this._instructorMembershipService.getInstructorById(instructorId);
      if (!instructor) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ message: ResponseMessages.INSTRUCTOR_NOT_FOUND });
        return;
      }

      if (
        instructor.membershipExpiryDate &&
        new Date(instructor.membershipExpiryDate) > new Date()
      ) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: ResponseMessages.ALREADY_ACTIVE_MEMBERSHIP,
          expiryDate: instructor.membershipExpiryDate,
        });
        return;
      }

      const result =
        await this._instructorMembershipOrderService.initiateCheckout(
          instructorId,
          planId
        );
      res.status(StatusCode.OK).json(result);
    } catch (error: any) {
      console.error("Checkout error:", error);

      if (error.message?.includes("already have an active membership")) {
        res.status(StatusCode.FORBIDDEN).json({
          message: error.message,
        });
      } else if (error.message?.includes("Invalid plan")) {
        res.status(StatusCode.BAD_REQUEST).json({
          message: error.message,
        });
      } else {
        res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .json({ message: ResponseMessages.CHECKOUT_FAILED });
      }
    }
  }

  async createRazorpayOrder(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { planId } = req.body;
      const instructorId = req.user?.id;

      if (!planId || !instructorId) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      const instructor =
        await this._instructorMembershipService.getInstructorById(instructorId);
      if (!instructor) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ message: ResponseMessages.INSTRUCTOR_NOT_FOUND });
        return;
      }

      if (
        instructor.membershipExpiryDate &&
        new Date(instructor.membershipExpiryDate) > new Date()
      ) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: ResponseMessages.ALREADY_ACTIVE_MEMBERSHIP,
          expiryDate: instructor.membershipExpiryDate,
        });
        return;
      }

      const result =
        await this._instructorMembershipOrderService.createRazorpayOrder(
          instructorId,
          planId
        );
      res.status(StatusCode.OK).json(result);
    } catch (error: any) {
      console.error("Razorpay order creation error:", error);

      if (error.message?.includes("already have an active membership")) {
        res.status(StatusCode.FORBIDDEN).json({
          message: error.message,
        });
      } else if (error.message?.includes("Invalid plan")) {
        res.status(StatusCode.BAD_REQUEST).json({
          message: error.message,
        });
      } else if (error.message?.includes("A pending order already exists")) {
        const match = error.message.match(/Order ID: (\w+)/);
        const orderId = match ? match[1] : undefined;
        res.status(StatusCode.CONFLICT).json({
          message: error.message,
          orderId,
          suggestion:
            "Please cancel the pending order or wait 15 minutes to try again.",
        });
      } else if (
        error.message?.includes("An order for this plan has already been paid")
      ) {
        res.status(StatusCode.CONFLICT).json({
          message: error.message,
        });
      } else {
        res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .json({ message: INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.FAILED_TO_CREATE_RAZORPAY_ORDER });
      }
    }
  }

  async retryFailedOrder(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { orderId } = req.params;
      const instructorId = req.user?.id;

      if (!orderId || !instructorId) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      const instructor =
        await this._instructorMembershipService.getInstructorById(instructorId);
      if (!instructor) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ message: ResponseMessages.INSTRUCTOR_NOT_FOUND });
        return;
      }

      if (
        instructor.membershipExpiryDate &&
        new Date(instructor.membershipExpiryDate) > new Date()
      ) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: ResponseMessages.ALREADY_ACTIVE_MEMBERSHIP,
          expiryDate: instructor.membershipExpiryDate,
        });
        return;
      }

      const result =
        await this._instructorMembershipOrderService.retryFailedOrder(
          orderId,
          instructorId
        );

      res.status(StatusCode.OK).json(result);
    } catch (error: any) {
      console.error("Retry order error:", error);

      if (error.message?.includes("Order not found")) {
        res.status(StatusCode.NOT_FOUND).json({
          message: error.message,
        });
      } else if (error.message?.includes("Only failed orders can be retried")) {
        res.status(StatusCode.BAD_REQUEST).json({
          message: error.message,
        });
      } else if (error.message?.includes("Unauthorized access")) {
        res.status(StatusCode.FORBIDDEN).json({
          message: error.message,
        });
      } else if (error.message?.includes("already have an active membership")) {
        res.status(StatusCode.FORBIDDEN).json({
          message: error.message,
        });
      } else {
        res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .json({ message: INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.FAILED_TO_RETRY_ORDER });
      }
    }
  }

  async verifyOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { razorpayOrderId, paymentId, signature, planId } = req.body;
      const instructorId = req.user?.id;

      if (
        !razorpayOrderId ||
        !paymentId ||
        !signature ||
        !planId ||
        !instructorId
      ) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      await this._instructorMembershipOrderService.verifyAndActivateMembership({
        razorpayOrderId,
        paymentId,
        signature,
        planId,
        instructorId,
      });

      res
        .status(StatusCode.OK)
        .json({ message: ResponseMessages.MEMBERSHIP_ACTIVATED });
    } catch (error) {
      console.error("Verification error:", error);
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ message: ResponseMessages.VERIFICATION_FAILED });
    }
  }

  async purchaseWithWallet(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { planId } = req.params;
      const instructorId = req.user?.id;

      if (!planId || !instructorId) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      const instructor =
        await this._instructorMembershipService.getInstructorById(instructorId);
      if (!instructor) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ message: ResponseMessages.INSTRUCTOR_NOT_FOUND });
        return;
      }

      if (
        instructor.membershipExpiryDate &&
        new Date(instructor.membershipExpiryDate) > new Date()
      ) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: ResponseMessages.ALREADY_ACTIVE_MEMBERSHIP,
          expiryDate: instructor.membershipExpiryDate,
        });
        return;
      }

      await this._instructorMembershipOrderService.purchaseWithWallet(
        instructorId,
        planId
      );

      res
        .status(StatusCode.OK)
        .json({ message: ResponseMessages.MEMBERSHIP_ACTIVATED });
    } catch (error: unknown) {
      console.error("Wallet purchase error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : ResponseMessages.WALLET_PURCHASE_FAILED;
      res.status(StatusCode.BAD_REQUEST).json({ message: errorMessage });
    }
  }

  async getInstructorOrders(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const instructorId = req.user?.id;
      if (!instructorId) {
        res
          .status(StatusCode.UNAUTHORIZED)
          .json({ message: INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.INSTRUCTOR_NOT_FOUND });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const { data, total } =
        await this._instructorMembershipOrderService.getInstructorOrders(
          instructorId,
          page,
          limit,
          search
        );

      res.status(StatusCode.OK).json({ data, total });
    } catch (error) {
      console.error("Fetch order history error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        message: INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_PURCHASE_HISTORY,
      });
    }
  }

  async getMembershipOrderDetail(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { orderId } = req.params;
      const instructorId = req.user?.id;

      if (!orderId || !instructorId) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: INSTRUCTOR_ERROR_MESSAGE.DATA_MISSING });
        return;
      }

      const order =
        await this._instructorMembershipOrderService.getOrderByOrderId(
          orderId,
          instructorId
        );
      if (!order) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ message: INSTRUCTOR_ERROR_MESSAGE.ORDER_NOT_FOUND });
        return;
      }

      res.status(StatusCode.OK).json(order);
    } catch (err: unknown) {
      console.error("Order detail fetch error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_FETCH_ORDER;
      res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: errorMessage });
    }
  }

  async downloadReceipt(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { orderId } = req.params;
      const instructorId = req.user?.id;

      if (!orderId || !instructorId) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: INSTRUCTOR_ERROR_MESSAGE.ORDER_NOT_FOUND });
        return;
      }

      const order =
        await this._instructorMembershipOrderService.getOrderByOrderId(
          orderId,
          instructorId
        );
      if (!order) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ message: INSTRUCTOR_ERROR_MESSAGE.ORDER_NOT_FOUND });
        return;
      }

      const pdfBuffer = await generateMembershipReceiptPdf(order);
      if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
        throw new Error("Failed to generate PDF buffer");
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Receipt_${orderId}.pdf`
      );
      res.send(pdfBuffer);
    } catch (err: unknown) {
      console.error("Receipt generation error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_GENERATE_RECEIPT;
      res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: errorMessage });
    }
  }

  async cancelOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.body;
      const instructorId = req.user?.id;

      if (!orderId || !instructorId) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      await this._instructorMembershipOrderService.cancelOrder(
        orderId,
        instructorId
      );

      res
        .status(StatusCode.OK)
        .json({ message: "Pending order cancelled successfully" });
    } catch (error: any) {
      console.error("Cancel order error:", error);
      const errorMessage = error.message || "Failed to cancel order";
      if (
        errorMessage.includes("Order not found") ||
        errorMessage.includes("Only pending orders can be cancelled") ||
        errorMessage.includes("Unauthorized access") ||
        errorMessage.includes("Order has already been paid on Razorpay")
      ) {
        res.status(StatusCode.BAD_REQUEST).json({ message: errorMessage });
      } else {
        res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .json({ message: INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.FAILED_TO_CANCEL });
      }
    }
  }

  async markOrderAsFailed(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { orderId } = req.body;
      const instructorId = req.user?.id;

      if (!orderId || !instructorId) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      await this._instructorMembershipOrderService.markOrderAsFailed(
        orderId,
        instructorId
      );

      res
        .status(StatusCode.OK)
        .json({ message: INSTRUCTOR_MEMBERSHIP_ORDER_SUCCESS_MESSAGE.MARKED_AS_FAILED });
    } catch (error: any) {
      console.error("Mark order as failed error:", error);
      const errorMessage = error.message || INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.FAILED_TO_MARK_AS_FAILED;
      res.status(StatusCode.BAD_REQUEST).json({ message: errorMessage });
    }
  }
}
