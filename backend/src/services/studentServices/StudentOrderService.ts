import { Types } from "mongoose";
import { IStudentOrderService } from "./interface/IStudentOrderService";
import { IStudentOrderRepository } from "../../repositories/studentRepository/interface/IStudentOrderRepository";
import { IOrder } from "../../models/orderModel";
import { OrderHistoryDTO } from "../../dto/userDTO/orderHistoryDTO";
import { OrderDetailsDTO } from "../../dto/userDTO/orderDetailsDTO";
import { toOrderHistoryDTO } from "../../mappers/userMapper/orderHistoryMapper";
import { toOrderDetailsDTO } from "../../mappers/userMapper/orderDetailMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";

export class StudentOrderService implements IStudentOrderService {
  private _orderRepo: IStudentOrderRepository;

  constructor(orderRepo: IStudentOrderRepository) {
    this._orderRepo = orderRepo;
  }

  async getOrderHistoryPaginated(
    userId: Types.ObjectId,
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ orders: OrderHistoryDTO[]; total: number }> {
    const { orders, total } = await this._orderRepo.getUserOrdersPaginated(
      userId,
      page,
      limit,
      search,
    );

    // Map orders to DTOs
    const orderDTOs = orders.map(toOrderHistoryDTO);

    return {
      orders: orderDTOs,
      total,
    };
  }

  async getOrderDetails(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<OrderDetailsDTO | null> {
    const order = await this._orderRepo.getOrderById(orderId, userId);

    if (!order) {
      return null;
    }

    // Handle presigned URLs for course thumbnails
    const coursesWithSignedUrls = await Promise.all(
      order.courses.map(async (course: any) => {
        const signedUrl = await getPresignedUrl(course.thumbnailUrl);
        return {
          ...course.toObject?.(),
          thumbnailUrl: signedUrl,
        };
      }),
    );

    const orderWithSignedUrls = {
      ...order.toObject?.(),
      courses: coursesWithSignedUrls,
    };

    // Map to DTO
    const orderDetailsDTO = toOrderDetailsDTO(orderWithSignedUrls);

    return orderDetailsDTO;
  }

  // For internal use when raw order data is needed (like for invoice generation)
  async getOrderRaw(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<IOrder | null> {
    return await this._orderRepo.getOrderById(orderId, userId);
  }
}
