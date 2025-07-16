import { IAdminMembershipOrderRepository } from "../interfaces/IAdminMembershipOrderRepository";
import { InstructorMembershipOrderModel } from "../../models/instructorMembershipOrderModel";
import { InstructorMembershipOrderDTO } from "../../models/instructorMembershipOrderModel";

export class AdminMembershipOrderRepository
  implements IAdminMembershipOrderRepository
{
  async findAllPaginated(
    page: number,
    limit: number
  ): Promise<{ data: InstructorMembershipOrderDTO[]; total: number }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      InstructorMembershipOrderModel.find({ paymentStatus: "paid" }) // 🔥 Filter added here
        .populate("instructorId", "name email")
        .populate("membershipPlanId", "name durationInDays")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InstructorMembershipOrderModel.countDocuments({ paymentStatus: "paid" }), // 🔥 Count only paid
    ]);

    const data: InstructorMembershipOrderDTO[] = orders.map((order) => ({
      instructor: {
        name: (order.instructorId as any).name,
        email: (order.instructorId as any).email,
      },
      membershipPlan: {
        name: (order.membershipPlanId as any).name,
        durationInDays: (order.membershipPlanId as any).durationInDays,
      },
      price: order.price,
      paymentStatus: order.paymentStatus,
      startDate: order.startDate,
      endDate: order.endDate,
      txnId: order.txnId,
      createdAt: order.createdAt,
    }));

    return { data, total };
  }

  async findByTxnId(
    txnId: string
  ): Promise<InstructorMembershipOrderDTO | null> {
    const order = await InstructorMembershipOrderModel.findOne({ txnId })
      .populate("instructorId", "name email")
      .populate("membershipPlanId", "name durationInDays")
      .lean();

    if (!order) return null;

    return {
      instructor: {
        name: (order.instructorId as any).name,
        email: (order.instructorId as any).email,
      },
      membershipPlan: {
        name: (order.membershipPlanId as any).name,
        durationInDays: (order.membershipPlanId as any).durationInDays,
      },
      price: order.price,
      paymentStatus: order.paymentStatus,
      startDate: order.startDate,
      endDate: order.endDate,
      txnId: order.txnId,
      createdAt: order.createdAt,
    };
  }
}
