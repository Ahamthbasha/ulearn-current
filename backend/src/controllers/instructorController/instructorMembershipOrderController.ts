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
import { appLogger } from "../../utils/logger";

export class InstructorMembershipOrderController
  implements IInstructorMembershipOrderController
{
  private _instructorMembershipOrderService: IInstructorMembershipOrderService;
  private _instructorMembershipService: IInstructorMembershipService;

  constructor(
    instructorMembershipOrderService: IInstructorMembershipOrderService,
    instructorMembershipService: IInstructorMembershipService,
  ) {
    this._instructorMembershipOrderService = instructorMembershipOrderService;
    this._instructorMembershipService = instructorMembershipService;
  }

  async initiateCheckout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { planId } = req.params;
      const instructorId = req.user?.id;

      if (!planId || !instructorId) {
        res.status(StatusCode.BAD_REQUEST).json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      const instructor = await this._instructorMembershipService.getInstructorById(instructorId);
      if (!instructor) {
        res.status(StatusCode.NOT_FOUND).json({ message: ResponseMessages.INSTRUCTOR_NOT_FOUND });
        return;
      }

      if (instructor.membershipExpiryDate && new Date(instructor.membershipExpiryDate) > new Date()) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: ResponseMessages.ALREADY_ACTIVE_MEMBERSHIP,
          expiryDate: instructor.membershipExpiryDate,
        });
        return;
      }

      const result = await this._instructorMembershipOrderService.initiateCheckout(instructorId, planId);
      res.status(StatusCode.OK).json(result);
    } catch (error) {
      appLogger.error("Checkout error:", error);
      const msg = (error as Error).message ?? "";
      if (msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.ALREADY_HAVE_AN_ACTIVE_MEMBERSHIP)) {
        res.status(StatusCode.FORBIDDEN).json({ message: msg });
      } else if (msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.INVALID_PLAN)) {
        res.status(StatusCode.BAD_REQUEST).json({ message: msg });
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.CHECKOUT_FAILED });
      }
    }
  }

  async createRazorpayOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { planId } = req.body;
      const instructorId = req.user?.id;

      if (!planId || !instructorId) {
        res.status(StatusCode.BAD_REQUEST).json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      const instructor = await this._instructorMembershipService.getInstructorById(instructorId);
      if (!instructor) {
        res.status(StatusCode.NOT_FOUND).json({ message: ResponseMessages.INSTRUCTOR_NOT_FOUND });
        return;
      }

      if (instructor.membershipExpiryDate && new Date(instructor.membershipExpiryDate) > new Date()) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: ResponseMessages.ALREADY_ACTIVE_MEMBERSHIP,
          expiryDate: instructor.membershipExpiryDate,
        });
        return;
      }

      const result = await this._instructorMembershipOrderService.createRazorpayOrder(instructorId, planId);
      res.status(StatusCode.OK).json(result);
    } catch (error) {
      appLogger.error("Razorpay order creation error:", error);
      const msg = (error as Error).message ?? "";
      if (msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.ALREADY_HAVE_AN_ACTIVE_MEMBERSHIP)) {
        res.status(StatusCode.FORBIDDEN).json({ message: msg });
      } else if (msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.INVALID_PLAN)) {
        res.status(StatusCode.BAD_REQUEST).json({ message: msg });
      } else if (msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.PENDING_ORDER_EXIST)) {
        const match = msg.match(/Order ID: (\w+)/);
        const orderId = match ? match[1] : undefined;
        res.status(StatusCode.CONFLICT).json({
          message: msg,
          orderId,
          suggestion: "Please cancel the pending order or wait 15 minutes to try again.",
        });
      } else if (msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.ALREADY_PAID)) {
        res.status(StatusCode.CONFLICT).json({ message: msg });
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          message: INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.FAILED_TO_CREATE_RAZORPAY_ORDER,
        });
      }
    }
  }

  async retryFailedOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const instructorId = req.user?.id;

      if (!orderId || !instructorId) {
        res.status(StatusCode.BAD_REQUEST).json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      const instructor = await this._instructorMembershipService.getInstructorById(instructorId);
      if (!instructor) {
        res.status(StatusCode.NOT_FOUND).json({ message: ResponseMessages.INSTRUCTOR_NOT_FOUND });
        return;
      }

      if (instructor.membershipExpiryDate && new Date(instructor.membershipExpiryDate) > new Date()) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: ResponseMessages.ALREADY_ACTIVE_MEMBERSHIP,
          expiryDate: instructor.membershipExpiryDate,
        });
        return;
      }

      const result = await this._instructorMembershipOrderService.retryFailedOrder(orderId, instructorId);
      res.status(StatusCode.OK).json(result);
    } catch (error) {
      appLogger.error("Retry order error:", error);
      const msg = (error as Error).message ?? "";
      if (msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.ORDER_NOT_FOUND)) {
        res.status(StatusCode.NOT_FOUND).json({ message: msg });
      } else if (msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.FAILED_ORDERS_ONLY_RETRY)) {
        res.status(StatusCode.BAD_REQUEST).json({ message: msg });
      } else if (msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.UNAUTHORIZED_ACCESS)) {
        res.status(StatusCode.FORBIDDEN).json({ message: msg });
      } else if (msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.ALREADY_HAVE_AN_ACTIVE_MEMBERSHIP)) {
        res.status(StatusCode.FORBIDDEN).json({ message: msg });
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          message: INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.FAILED_TO_RETRY_ORDER,
        });
      }
    }
  }

  async verifyOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { razorpayOrderId, paymentId, signature, planId } = req.body;
      const instructorId = req.user?.id;

      if (!razorpayOrderId || !paymentId || !signature || !planId || !instructorId) {
        res.status(StatusCode.BAD_REQUEST).json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      await this._instructorMembershipOrderService.verifyAndActivateMembership({
        razorpayOrderId,
        paymentId,
        signature,
        planId,
        instructorId,
      });

      res.status(StatusCode.OK).json({ message: ResponseMessages.MEMBERSHIP_ACTIVATED });
    } catch (error) {
      appLogger.error("Verification error:", error);
      res.status(StatusCode.BAD_REQUEST).json({ message: ResponseMessages.VERIFICATION_FAILED });
    }
  }

  async purchaseWithWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { planId } = req.params;
      const instructorId = req.user?.id;

      if (!planId || !instructorId) {
        res.status(StatusCode.BAD_REQUEST).json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      const instructor = await this._instructorMembershipService.getInstructorById(instructorId);
      if (!instructor) {
        res.status(StatusCode.NOT_FOUND).json({ message: ResponseMessages.INSTRUCTOR_NOT_FOUND });
        return;
      }

      if (instructor.membershipExpiryDate && new Date(instructor.membershipExpiryDate) > new Date()) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: ResponseMessages.ALREADY_ACTIVE_MEMBERSHIP,
          expiryDate: instructor.membershipExpiryDate,
        });
        return;
      }

      await this._instructorMembershipOrderService.purchaseWithWallet(instructorId, planId);
      res.status(StatusCode.OK).json({ message: ResponseMessages.MEMBERSHIP_ACTIVATED });
    } catch (error) {
      appLogger.error("Wallet purchase error:", error);
      const msg = error instanceof Error ? error.message : ResponseMessages.WALLET_PURCHASE_FAILED;
      res.status(StatusCode.BAD_REQUEST).json({ message: msg });
    }
  }

  async getInstructorOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.id;
      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          message: INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.INSTRUCTOR_NOT_FOUND,
        });
        return;
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search as string | undefined;

      const { data, total } = await this._instructorMembershipOrderService.getInstructorOrders(
        instructorId,
        page,
        limit,
        search,
      );

      res.status(StatusCode.OK).json({ data, total });
    } catch (error) {
      appLogger.error("Fetch order history error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        message: INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_PURCHASE_HISTORY,
      });
    }
  }

  async getMembershipOrderDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const instructorId = req.user?.id;

      if (!orderId || !instructorId) {
        res.status(StatusCode.BAD_REQUEST).json({ message: INSTRUCTOR_ERROR_MESSAGE.DATA_MISSING });
        return;
      }

      const order = await this._instructorMembershipOrderService.getOrderByOrderId(orderId, instructorId);
      if (!order) {
        res.status(StatusCode.NOT_FOUND).json({ message: INSTRUCTOR_ERROR_MESSAGE.ORDER_NOT_FOUND });
        return;
      }

      res.status(StatusCode.OK).json(order);
    } catch (error) {
      appLogger.error("Order detail fetch error:", error);
      const msg = error instanceof Error ? error.message : INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_FETCH_ORDER;
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: msg });
    }
  }

  async downloadReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const instructorId = req.user?.id;

      if (!orderId || !instructorId) {
        res.status(StatusCode.BAD_REQUEST).json({ message: INSTRUCTOR_ERROR_MESSAGE.ORDER_NOT_FOUND });
        return;
      }

      const order = await this._instructorMembershipOrderService.getOrderByOrderId(orderId, instructorId);
      if (!order) {
        res.status(StatusCode.NOT_FOUND).json({ message: INSTRUCTOR_ERROR_MESSAGE.ORDER_NOT_FOUND });
        return;
      }

      const pdfBuffer = await generateMembershipReceiptPdf(order);
      if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
        throw new Error("Failed to generate PDF buffer");
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Receipt_${orderId}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      appLogger.error("Receipt generation error:", error);
      const msg = error instanceof Error ? error.message : INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_GENERATE_RECEIPT;
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: msg });
    }
  }

  async cancelOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.body;
      const instructorId = req.user?.id;

      if (!orderId || !instructorId) {
        res.status(StatusCode.BAD_REQUEST).json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      await this._instructorMembershipOrderService.cancelOrder(orderId, instructorId);
      res.status(StatusCode.OK).json({
        message: INSTRUCTOR_MEMBERSHIP_ORDER_SUCCESS_MESSAGE.ORDER_CANCELLED_SUCCESSFULLY,
      });
    } catch (error) {
      appLogger.error("Cancel order error:", error);
      const msg = (error as Error).message ?? "Failed to cancel order";
      if (
        msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.ORDER_NOT_FOUND) ||
        msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.PENDING_ORDERS_ONLY_ABLE_TO_CANCEL) ||
        msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.UNAUTHORIZED_ACCESS) ||
        msg.includes(INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.PAID_BY_RAZORPAY)
      ) {
        res.status(StatusCode.BAD_REQUEST).json({ message: msg });
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          message: INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.FAILED_TO_CANCEL,
        });
      }
    }
  }

  async markOrderAsFailed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.body;
      const instructorId = req.user?.id;

      if (!orderId || !instructorId) {
        res.status(StatusCode.BAD_REQUEST).json({ message: ResponseMessages.MISSING_DATA });
        return;
      }

      await this._instructorMembershipOrderService.markOrderAsFailed(orderId, instructorId);
      res.status(StatusCode.OK).json({
        message: INSTRUCTOR_MEMBERSHIP_ORDER_SUCCESS_MESSAGE.MARKED_AS_FAILED,
      });
    } catch (error) {
      appLogger.error("Mark order as failed error:", error);
      const msg = (error as Error).message ?? INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE.FAILED_TO_MARK_AS_FAILED;
      res.status(StatusCode.BAD_REQUEST).json({ message: msg });
    }
  }
}