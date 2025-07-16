import { Response } from "express";
import { Types } from "mongoose";
import { IStudentOrderController } from "./interfaces/IStudentOrderController";
import { IStudentOrderService } from "../../services/interface/IStudentOrderService";
import { AuthenticatedRequest } from "../../middlewares/AuthenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { generateInvoicePdf } from "../../utils/generateInvoicePdf";

export class StudentOrderController implements IStudentOrderController {
  constructor(private orderService: IStudentOrderService) {}

  async getOrderHistory(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user!.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;

      const { orders, total } =
        await this.orderService.getOrderHistoryPaginated(userId, page, limit);

      console.log("orders", orders);
      res.status(StatusCode.OK).json({ success: true, orders, total });
    } catch (err) {
      console.error(err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch order history",
      });
    }
  }

  async getOrderDetails(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const orderId = new Types.ObjectId(req.params.orderId);
      const userId = new Types.ObjectId(req.user!.id);

      const order = await this.orderService.getOrderDetails(orderId, userId);

      if (!order) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Order not found",
        });
        return;
      }

      // ✅ Inject pre-signed thumbnail URLs for each course
      const coursesWithSignedUrls = await Promise.all(
        order.courses.map(async (course: any) => {
          const signedUrl = await getPresignedUrl(course.thumbnailUrl);
          return {
            ...(course.toObject?.() || course),
            thumbnailUrl: signedUrl,
          };
        })
      );
      const orderWithSignedUrls = {
        ...(order.toObject?.() || order),
        courses: coursesWithSignedUrls,
      };

      console.log(orderWithSignedUrls);

      res
        .status(StatusCode.OK)
        .json({ success: true, order: orderWithSignedUrls });
    } catch (err) {
      console.error(err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch order details",
      });
    }
  }

  async downloadInvoice(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const orderId = new Types.ObjectId(req.params.orderId);
      const userId = new Types.ObjectId(req.user!.id);

      const order = await this.orderService.getOrderDetails(orderId, userId);

      if (!order) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Order not found",
        });
        return;
      }

      // Generate PDF
      const pdfBuffer = await generateInvoicePdf(order);

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${order._id}.pdf`,
      });

      res.send(pdfBuffer);
    } catch (err) {
      console.error(err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to download invoice",
      });
    }
  }
}
