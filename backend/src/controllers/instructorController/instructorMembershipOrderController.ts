import { Response } from "express";
import { IInstructorMembershipOrderController } from "./interfaces/IInstructorMembershipOrderController";
import { IInstructorMembershipOrderService } from "../../services/instructorServices/interface/IInstructorMembershipOrderService";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { IInstructorMembershipService } from "../../services/instructorServices/interface/IInstructorMembershipService";
import {
  INSTRUCTOR_ERROR_MESSAGE,
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
    instructorMembershipService: IInstructorMembershipService,
  ) {
    this._instructorMembershipOrderService = instructorMembershipOrderService;
    this._instructorMembershipService = instructorMembershipService;
  }

  async initiateCheckout(
    req: AuthenticatedRequest,
    res: Response,
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
          planId,
        );
      res.status(StatusCode.OK).json(result);
    } catch (error) {
      console.error("Checkout error:", error);
      res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: ResponseMessages.CHECKOUT_FAILED });
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
    res: Response,
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
        planId,
      );

      res
        .status(StatusCode.OK)
        .json({ message: ResponseMessages.MEMBERSHIP_ACTIVATED });
    } catch (error: any) {
      console.error("Wallet purchase error:", error);
      res.status(StatusCode.BAD_REQUEST).json({
        message: error?.message || ResponseMessages.WALLET_PURCHASE_FAILED,
      });
    }
  }

  async getInstructorOrders(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const instructorId = req.user?.id;
      if (!instructorId) {
        res
          .status(StatusCode.UNAUTHORIZED)
          .json({ message: "Instructor not found" });
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
          search,
        );

      res.status(StatusCode.OK).json({ data, total });
    } catch (error) {
      console.error("Fetch order history error:", error);
      res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_PURCHASE_HISTORY });
    }
  }

  async getMembershipOrderDetail(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { txnId } = req.params;
      const instructorId = req.user?.id;

      if (!txnId || !instructorId) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: INSTRUCTOR_ERROR_MESSAGE.DATA_MISSING });
        return;
      }

      const order =
        await this._instructorMembershipOrderService.getOrderByTxnId(
          txnId,
          instructorId,
        );
      if (!order) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ message: INSTRUCTOR_ERROR_MESSAGE.ORDER_NOT_FOUND });
        return;
      }

      res.status(StatusCode.OK).json(order);
    } catch (err: any) {
      console.error("Order detail fetch error:", err);
      res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_FETCH_ORDER });
    }
  }

  async downloadReceipt(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { txnId } = req.params;
      const instructorId = req.user?.id;

      if (!txnId || !instructorId) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: INSTRUCTOR_ERROR_MESSAGE.TXNID_NOT_FOUND });
        return;
      }

      const order =
        await this._instructorMembershipOrderService.getOrderByTxnId(
          txnId,
          instructorId,
        );
      if (!order) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ message: INSTRUCTOR_ERROR_MESSAGE.ORDER_NOT_FOUND });
        return;
      }

      const pdfBuffer = await generateMembershipReceiptPdf(order);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Receipt_${txnId}.pdf`,
      );
      res.send(pdfBuffer);
    } catch (err) {
      console.error("Receipt generation error:", err);
      res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_GENERATE_RECEIPT });
    }
  }
}
