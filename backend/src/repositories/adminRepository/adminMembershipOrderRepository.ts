import { IAdminMembershipOrderRepository } from "./interface/IAdminMembershipOrderRepository";
import { InstructorMembershipOrderModel } from "../../models/instructorMembershipOrderModel";
import { InstructorMembershipOrderDTO } from "../../models/instructorMembershipOrderModel";
import {
  InstructorPopulated,
  MembershipPlanPopulated,
} from "../../models/instructorMembershipOrderModel";

export class AdminMembershipOrderRepository
  implements IAdminMembershipOrderRepository
{
  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: InstructorMembershipOrderDTO[]; total: number }> {
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { paymentStatus: "paid" };

    if (search?.trim()) {
      query.txnId = { $regex: search.trim(), $options: "i" };
    }

    const [orders, total] = await Promise.all([
      InstructorMembershipOrderModel.find(query)
        .populate<{
          instructorId: InstructorPopulated;
        }>("instructorId", "username email")
        .populate<{
          membershipPlanId: MembershipPlanPopulated;
        }>("membershipPlanId", "name durationInDays")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InstructorMembershipOrderModel.countDocuments(query),
    ]);

    const data: InstructorMembershipOrderDTO[] = orders.map((order) => ({
      instructor: {
        name: order.instructorId?.username ?? "",
        email: order.instructorId?.email ?? "",
      },
      membershipPlan: {
        name: order.membershipPlanId?.name ?? "",
        durationInDays: order.membershipPlanId?.durationInDays ?? 0,
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
    txnId: string,
  ): Promise<InstructorMembershipOrderDTO | null> {
    const order = await InstructorMembershipOrderModel.findOne({ txnId })
      .populate<{
        instructorId: InstructorPopulated;
      }>("instructorId", "username email")
      .populate<{
        membershipPlanId: MembershipPlanPopulated;
      }>("membershipPlanId", "name durationInDays description benefits")
      .lean();

    if (!order) return null;

    return {
      instructor: {
        name: order.instructorId?.username ?? "",
        email: order.instructorId?.email ?? "",
      },
      membershipPlan: {
        name: order.membershipPlanId?.name ?? "",
        durationInDays: order.membershipPlanId?.durationInDays ?? 0,
        description: order.membershipPlanId?.description ?? "",
        benefits: order.membershipPlanId?.benefits ?? [],
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
