import { IAdminMembershipOrderRepository } from "./interface/IAdminMembershipOrderRepository";
import { InstructorMembershipOrderModel } from "../../models/instructorMembershipOrderModel";
import { InstructorMembershipOrderDTO } from "../../models/instructorMembershipOrderModel";
import {
  InstructorPopulated,
  MembershipPlanPopulated,
} from "../../models/instructorMembershipOrderModel";
import { PipelineStage } from "mongoose";

export class AdminMembershipOrderRepository
  implements IAdminMembershipOrderRepository
{
  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    status?: "paid" | "failed" | "cancelled",
  ): Promise<{ data: InstructorMembershipOrderDTO[]; total: number }> {
    const skip = (page - 1) * limit;

    // Use aggregation pipeline for advanced search
    const pipeline: PipelineStage[] = [
      // Lookup instructor details
      {
        $lookup: {
          from: "instructors", // Make sure this matches your instructor collection name
          localField: "instructorId",
          foreignField: "_id",
          as: "instructorData",
        },
      },
      // Lookup membership plan details
      {
        $lookup: {
          from: "membershipplans", // Make sure this matches your membership plan collection name
          localField: "membershipPlanId",
          foreignField: "_id",
          as: "membershipPlanData",
        },
      },
      // Unwind the arrays
      {
        $unwind: { path: "$instructorData", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: {
          path: "$membershipPlanData",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // Build match conditions
    const matchConditions:{
      paymentStatus?: "paid" | "failed" | "cancelled";
      $or?: Array<Record<string, unknown>>;
    } = {};

    // Status filter
    if (status) {
      matchConditions.paymentStatus = status;
    }

    // Enhanced search - search by txnId OR instructor name
    if (search?.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      matchConditions.$or = [
        { txnId: searchRegex },
        { "instructorData.username": searchRegex },
        { "instructorData.email": searchRegex },
      ];
    }

    // Add match stage if we have conditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Add sorting
    pipeline.push({ $sort: { createdAt: -1 } });

    // Get total count first
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult =
      await InstructorMembershipOrderModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination to main pipeline
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Execute main aggregation
    const orders = await InstructorMembershipOrderModel.aggregate(pipeline);

    const data: InstructorMembershipOrderDTO[] = orders.map((order) => ({
      orderId: order.orderId,
      instructor: {
        name: order.instructorData?.username ?? "",
        email: order.instructorData?.email ?? "",
      },
      membershipPlan: {
        name: order.membershipPlanData?.name ?? "",
        durationInDays: order.membershipPlanData?.durationInDays ?? 0,
      },
      price: order.price,
      paymentStatus: order.paymentStatus,
      startDate: order.startDate,
      endDate: order.endDate,
      razorpayOrderId: order.razorpayOrderId,
      createdAt: order.createdAt,
    }));

    return { data, total };
  }

  async findByTxnId(
    razorpayOrderId: string,
  ): Promise<InstructorMembershipOrderDTO | null> {
    const order = await InstructorMembershipOrderModel.findOne({
      razorpayOrderId,
    })
      .populate<{
        instructorId: InstructorPopulated;
      }>("instructorId", "username email")
      .populate<{
        membershipPlanId: MembershipPlanPopulated;
      }>("membershipPlanId", "name durationInDays description benefits")
      .lean();

    if (!order) return null;

    return {
      orderId: order.orderId,
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
      razorpayOrderId: order.razorpayOrderId,
      createdAt: order.createdAt,
    };
  }
}
