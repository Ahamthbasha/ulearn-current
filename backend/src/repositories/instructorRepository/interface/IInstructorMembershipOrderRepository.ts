import { IInstructorMembershipOrder } from "../../../models/instructorMembershipOrderModel"; 

export interface IInstructorMembershipOrderRepository {
  createOrder(
    data: {
      instructorId: string;
      planId: string;
      razorpayOrderId: string;
      amount: number;
      status: "pending" | "paid";
      startDate?: Date;
      endDate?: Date;
    },
    session?: import("mongoose").ClientSession
  ): Promise<IInstructorMembershipOrder>;

  findByOrderId(
    orderId: string
  ): Promise<IInstructorMembershipOrder | null>;

  updateOrderStatus(
    orderId: string,
    data: Partial<IInstructorMembershipOrder>,
    session?: import("mongoose").ClientSession
  ): Promise<void>;

  findAllByInstructorId(
    instructorId: string,
    page?: number,
    limit?: number,
    search?: string
  ): Promise<{ data: IInstructorMembershipOrder[]; total: number }>;

  findOneByOrderId(
    orderId: string
  ): Promise<IInstructorMembershipOrder | null>;

  findExistingOrder(
    instructorId: string,
    planId: string,
    session?: import("mongoose").ClientSession
  ): Promise<IInstructorMembershipOrder | null>;

  cancelOrder(
    orderId: string,
    session?: import("mongoose").ClientSession
  ): Promise<void>;

    findByRazorpayOrderId(razorpayOrderId:string):Promise<IInstructorMembershipOrder | null>
}
