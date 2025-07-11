import { InstructorMembershipOrderModel, IInstructorMembershipOrder } from "../../models/instructorMembershipOrderModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorMembershipOrderRepository } from "../interfaces/IInstructorMembershipOrderRepository";
import {Types} from "mongoose"

export class InstructorMembershipOrderRepository extends GenericRepository<IInstructorMembershipOrder> implements IInstructorMembershipOrderRepository {

    constructor(){
        super(InstructorMembershipOrderModel)
    }
 async createOrder(data: {
  instructorId: string;
  planId: string;
  razorpayOrderId: string;
  amount: number;
  status: "pending" | "paid";
  startDate?: Date;
  endDate?: Date;
}) {
  return await this.create({
    instructorId: new Types.ObjectId(data.instructorId),
    membershipPlanId: new Types.ObjectId(data.planId),
    price: data.amount,
    txnId: data.razorpayOrderId,
    paymentStatus: data.status,
    startDate: data.startDate || new Date(),
    endDate: data.endDate || new Date(), // fallback
  });
}


async findByRazorpayOrderId(orderId: string) {
  return await this.findOne({ txnId: orderId });
}

async updateOrderStatus(orderId: string, data: Partial<IInstructorMembershipOrder>) {
  await this.updateOne({ txnId: orderId }, data);
}

async findAllByInstructorId(
  instructorId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: IInstructorMembershipOrder[]; total: number }> {
  const filter = {
    instructorId: new Types.ObjectId(instructorId),
    paymentStatus: "paid",
  };

  return await this.paginate(filter, page, limit, { createdAt: -1 }, ["membershipPlanId"]);
}


async findOneByTxnId(txnId: string): Promise<IInstructorMembershipOrder | null> {
  return await this.findOne({ txnId }, ["membershipPlanId","instructorId"]);
}



}
