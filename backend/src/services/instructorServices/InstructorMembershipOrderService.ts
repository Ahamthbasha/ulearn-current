import { IInstructorMembershipOrderService } from "../interface/IInstructorMembershipOrderService";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Types } from "mongoose";

import { IInstructorMembershipOrder } from "../../models/instructorMembershipOrderModel";
import { IInstructorMembershipOrderRepository } from "../../repositories/interfaces/IInstructorMembershipOrderRepository";
import { IInstructorMembershipRepository } from "../../repositories/interfaces/IInstructorMembershipRepository";
import IInstructorRepository from "../../repositories/interfaces/IInstructorRepository";
import { IMembershipPlan } from "../../models/membershipPlanModel";
import { IWalletService } from "../interface/IWalletService";
import { IEmail } from "../../types/Email";

export class InstructorMembershipOrderService implements IInstructorMembershipOrderService {
  constructor(
    private readonly membershipOrderRepo: IInstructorMembershipOrderRepository,
    private readonly planRepo: IInstructorMembershipRepository,
    private readonly instructorRepo: IInstructorRepository,
    private readonly razorpay: Razorpay,
    private readonly walletService: IWalletService,
    private readonly emailService: IEmail
  ) {}

  async initiateCheckout(instructorId: string, planId: string) {
    const instructor = await this.instructorRepo.findById(instructorId);
    if (!instructor) throw new Error("Instructor not found");

    if (
      instructor.membershipExpiryDate &&
      new Date(instructor.membershipExpiryDate) > new Date()
    ) {
      throw new Error("You already have an active membership.");
    }

    const plan = await this.planRepo.findById(planId) as IMembershipPlan;
    if (!plan) throw new Error("Invalid plan");

    const razorpayOrder = await this.razorpay.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: plan.price,
      currency: "INR",
      planName: plan.name,
      durationInDays: plan.durationInDays,
      description: plan.description || "",
      benefits: plan.benefits || [],
    };
  }

  async verifyAndActivateMembership({
    razorpayOrderId,
    paymentId,
    signature,
    instructorId,
    planId,
  }: {
    razorpayOrderId: string;
    paymentId: string;
    signature: string;
    instructorId: string;
    planId: string;
  }): Promise<void> {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new Error("Invalid Razorpay signature");
    }

    const instructor = await this.instructorRepo.findById(instructorId);
    if (!instructor) throw new Error("Instructor not found");

    let order = await this.membershipOrderRepo.findByRazorpayOrderId(razorpayOrderId);

    const plan = await this.planRepo.findById(planId) as IMembershipPlan;
    if (!plan || !plan.durationInDays || !plan._id) {
      throw new Error("Invalid membership plan");
    }

    const now = new Date();
    const expiryDate = new Date(now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);

    if (!order) {
      order = await this.membershipOrderRepo.createOrder({
        instructorId,
        planId: plan._id.toString(),
        razorpayOrderId,
        amount: plan.price,
        status: "paid",
        startDate: now,
        endDate: expiryDate,
      });
    } else {
      if (order.paymentStatus === "paid") {
        throw new Error("Order already processed");
      }

      await this.membershipOrderRepo.updateOrderStatus(razorpayOrderId, {
        paymentStatus: "paid",
        startDate: now,
        endDate: expiryDate,
      });
    }

    await this.instructorRepo.update(instructorId, {
      isMentor: true,
      membershipExpiryDate: expiryDate,
      membershipPlanId: new Types.ObjectId(plan._id),
    });

    await this.walletService.creditAdminWalletByEmail(
      process.env.ADMINEMAIL!,
      plan.price,
      `Instructor Membership (Razorpay): ${plan.name}`,
      paymentId
    );

    await this.emailService.sendMembershipPurchaseEmail(
      instructor.username || "Instructor",
      instructor.email || "",
      plan.name,
      expiryDate
    );
  }

  async purchaseWithWallet(instructorId: string, planId: string): Promise<void> {
    const instructor = await this.instructorRepo.findById(instructorId);
    if (!instructor) throw new Error("Instructor not found");

    if (
      instructor.membershipExpiryDate &&
      new Date(instructor.membershipExpiryDate) > new Date()
    ) {
      throw new Error("You already have an active membership.");
    }

    const plan = await this.planRepo.findById(planId) as IMembershipPlan;
    if (!plan || !plan._id) throw new Error("Membership plan not found");

    const amount = plan.price;
    const txnId = `wallet_membership_${Date.now()}`;

    const instructorWallet = await this.walletService.debitWallet(
      instructor._id.toString(),
      amount,
      `Membership Purchase: ${plan.name}`,
      txnId
    );

    if (!instructorWallet) {
      throw new Error("Insufficient wallet balance");
    }

    try {
      await this.walletService.creditAdminWalletByEmail(
        process.env.ADMINEMAIL!,
        amount,
        `Instructor Membership: ${plan.name}`,
        txnId
      );
    } catch (err) {
      await this.walletService.creditWallet(
        new Types.ObjectId(instructor._id.toString()),
        amount,
        `Refund: Failed admin credit`,
        `refund_${txnId}`
      );
      throw new Error("Admin credit failed. Transaction rolled back.");
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);

    await this.membershipOrderRepo.createOrder({
      instructorId,
      planId: plan._id.toString(),
      razorpayOrderId: txnId,
      amount,
      status: "paid",
      startDate: now,
      endDate: expiry,
    });

    await this.instructorRepo.update(instructorId, {
      isMentor: true,
      membershipExpiryDate: expiry,
      membershipPlanId: new Types.ObjectId(plan._id),
    });

    await this.emailService.sendMembershipPurchaseEmail(
      instructor.username,
      instructor.email,
      plan.name,
      expiry
    );
  }

  async getInstructorOrders(
    instructorId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: IInstructorMembershipOrder[]; total: number }> {
    return await this.membershipOrderRepo.findAllByInstructorId(instructorId, page, limit);
  }

  async getOrderByTxnId(txnId: string, instructorId: string) {
    const order = await this.membershipOrderRepo.findOneByTxnId(txnId);
    if (!order) throw new Error("Order not found");

    const orderInstructorId = (order.instructorId as any)._id
      ? (order.instructorId as any)._id.toString()
      : order.instructorId.toString();

    if (orderInstructorId !== instructorId.toString()) {
      throw new Error("Unauthorized access");
    }

    return order;
  }
}
