import { Types } from "mongoose";
import { IOrder, OrderModel } from "../../models/orderModel";
import { IStudentOrderRepository } from "../interfaces/IStudentOrderRepository";
import { GenericRepository } from "../genericRepository";

export class StudentOrderRepository
  extends GenericRepository<IOrder>
  implements IStudentOrderRepository
{
  constructor() {
    super(OrderModel);
  }

  async getUserOrdersPaginated(
    userId: Types.ObjectId,
    page: number,
    limit: number
  ): Promise<{ orders: IOrder[]; total: number }> {
    const { data, total } = await this.paginate(
      { userId, status: "SUCCESS" },
      page,
      limit,
      { createdAt: -1 },
      ["courses"]
    );

    return { orders: data, total }; // ✅ rename data → orders
  }

  async getOrderById(
    orderId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<IOrder | null> {
    return await this.findOne({ _id: orderId, userId, status: "SUCCESS" }, [
      "courses",
      "userId",
    ]);
  }
}
