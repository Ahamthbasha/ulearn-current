import { IInstructorMembershipOrderService } from "./interface/IInstructorMembershipOrderService"; 
import Razorpay from "razorpay";
import crypto from "crypto";
import { Types } from "mongoose";
import { InstructorMembershipOrderListDTO, InstructorMembershipOrderDTO } from "../../models/instructorMembershipOrderModel";
import { IInstructorMembershipOrderRepository } from "../../repositories/instructorRepository/interface/IInstructorMembershipOrderRepository"; 
import { IInstructorMembershipRepository } from "../../repositories/instructorRepository/interface/IInstructorMembershipRepository"; 
import IInstructorRepository from "../../repositories/instructorRepository/interface/IInstructorRepository"; 
import { IMembershipPlan } from "../../models/membershipPlanModel";
import { IWalletService } from "../interface/IWalletService";
import { IEmail } from "../../types/Email";

export class InstructorMembershipOrderService implements IInstructorMembershipOrderService {
    private _membershipOrderRepo: IInstructorMembershipOrderRepository
    private _planRepo: IInstructorMembershipRepository
    private _instructorRepo: IInstructorRepository
    private _razorpay: Razorpay
    private _walletService: IWalletService
    private _emailService: IEmail
  constructor(membershipOrderRepo: IInstructorMembershipOrderRepository,planRepo: IInstructorMembershipRepository, instructorRepo: IInstructorRepository,razorpay: Razorpay,walletService: IWalletService,emailService: IEmail
  ) {
    this._membershipOrderRepo = membershipOrderRepo
    this._planRepo = planRepo
    this._instructorRepo = instructorRepo
    this._razorpay = razorpay
    this._walletService = walletService
    this._emailService = emailService
  }

  async initiateCheckout(instructorId: string, planId: string) {
    const instructor = await this._instructorRepo.findById(instructorId);
    if (!instructor) throw new Error("Instructor not found");

    if (
      instructor.membershipExpiryDate &&
      new Date(instructor.membershipExpiryDate) > new Date()
    ) {
      throw new Error("You already have an active membership.");
    }

    const plan = await this._planRepo.findById(planId) as IMembershipPlan;
    if (!plan) throw new Error("Invalid plan");

    const razorpayOrder = await this._razorpay.orders.create({
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

    const instructor = await this._instructorRepo.findById(instructorId);
    if (!instructor) throw new Error("Instructor not found");
  if (
    instructor.membershipExpiryDate &&
    new Date(instructor.membershipExpiryDate) > new Date()
  ) {
    throw new Error("You already have an active membership.");
  }

    let order = await this._membershipOrderRepo.findByRazorpayOrderId(razorpayOrderId);

    const plan = await this._planRepo.findById(planId) as IMembershipPlan;
    if (!plan || !plan.durationInDays || !plan._id) {
      throw new Error("Invalid membership plan");
    }

    const now = new Date();
    const expiryDate = new Date(now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);

    if (!order) {
      order = await this._membershipOrderRepo.createOrder({
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

      await this._membershipOrderRepo.updateOrderStatus(razorpayOrderId, {
        paymentStatus: "paid",
        startDate: now,
        endDate: expiryDate,
      });
    }

    await this._instructorRepo.update(instructorId, {
      isMentor: true,
      membershipExpiryDate: expiryDate,
      membershipPlanId: new Types.ObjectId(plan._id),
    });

    await this._walletService.creditAdminWalletByEmail(
      process.env.ADMINEMAIL!,
      plan.price,
      `Instructor Membership (Razorpay): ${plan.name}`,
      paymentId
    );

    await this._emailService.sendMembershipPurchaseEmail(
      instructor.username || "Instructor",
      instructor.email || "",
      plan.name,
      expiryDate
    );
  }

  async purchaseWithWallet(instructorId: string, planId: string): Promise<void> {
    const instructor = await this._instructorRepo.findById(instructorId);
    if (!instructor) throw new Error("Instructor not found");

    if (
      instructor.membershipExpiryDate &&
      new Date(instructor.membershipExpiryDate) > new Date()
    ) {
      throw new Error("You already have an active membership.");
    }

    const plan = await this._planRepo.findById(planId) as IMembershipPlan;
    if (!plan || !plan._id) throw new Error("Membership plan not found");

    const amount = plan.price;
    const txnId = `wallet_membership_${Date.now()}`;

    const instructorWallet = await this._walletService.debitWallet(
      instructor._id.toString(),
      amount,
      `Membership Purchase: ${plan.name}`,
      txnId
    );

    if (!instructorWallet) {
      throw new Error("Insufficient wallet balance");
    }

    try {
      await this._walletService.creditAdminWalletByEmail(
        process.env.ADMINEMAIL!,
        amount,
        `Instructor Membership: ${plan.name}`,
        txnId
      );
    } catch (err) {
      await this._walletService.creditWallet(
        new Types.ObjectId(instructor._id.toString()),
        amount,
        `Refund: Failed admin credit`,
        `refund_${txnId}`
      );
      throw new Error("Admin credit failed. Transaction rolled back.");
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);

    await this._membershipOrderRepo.createOrder({
      instructorId,
      planId: plan._id.toString(),
      razorpayOrderId: txnId,
      amount,
      status: "paid",
      startDate: now,
      endDate: expiry,
    });

    await this._instructorRepo.update(instructorId, {
      isMentor: true,
      membershipExpiryDate: expiry,
      membershipPlanId: new Types.ObjectId(plan._id),
    });

    await this._emailService.sendMembershipPurchaseEmail(
      instructor.username,
      instructor.email,
      plan.name,
      expiry
    );
  }

  async getInstructorOrders(
    instructorId: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ data: InstructorMembershipOrderListDTO[]; total: number }> {
    const { data, total } = await this._membershipOrderRepo.findAllByInstructorId(
      instructorId,
      page,
      limit,
      search
    );

    const dtoData: InstructorMembershipOrderListDTO[] = data.map(order => ({
      orderId: order.txnId,
      planName: (order.membershipPlanId as any).name,
      amount: order.price,
      status: order.paymentStatus,
      purchaseDate: order.createdAt
    }));

    return { data: dtoData, total };
  }

  // 🆕 UPDATED METHOD - Added benefits
  async getOrderByTxnId(txnId: string, instructorId: string): Promise<InstructorMembershipOrderDTO | null> {
    const order = await this._membershipOrderRepo.findOneByTxnId(txnId);
    if (!order) throw new Error("Order not found");

    const orderInstructorId = (order.instructorId as any)._id.toString();

    if (orderInstructorId !== instructorId.toString()) {
      throw new Error("Unauthorized access");
    }

    return {
      instructor: {
        name: (order.instructorId as any).username,
        email: (order.instructorId as any).email
      },
      membershipPlan: {
        name: (order.membershipPlanId as any).name,
        durationInDays: (order.membershipPlanId as any).durationInDays,
        description: (order.membershipPlanId as any).description,
        benefits: (order.membershipPlanId as any).benefits || [] // 🆕 Added benefits
      },
      price: order.price,
      paymentStatus: order.paymentStatus,
      startDate: order.startDate,
      endDate: order.endDate,
      txnId: order.txnId,
      createdAt: order.createdAt
    };
  }
}