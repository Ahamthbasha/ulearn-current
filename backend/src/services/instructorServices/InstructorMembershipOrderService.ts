import { IInstructorMembershipOrderService } from "./interface/IInstructorMembershipOrderService";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Types, ClientSession, startSession } from "mongoose";
import {
  InstructorMembershipOrderListDTO,
  InstructorMembershipOrderDTO,
} from "../../models/instructorMembershipOrderModel";
import { IInstructorMembershipOrderRepository } from "../../repositories/instructorRepository/interface/IInstructorMembershipOrderRepository";
import { IInstructorMembershipRepository } from "../../repositories/instructorRepository/interface/IInstructorMembershipRepository";
import IInstructorRepository from "../../repositories/instructorRepository/interface/IInstructorRepository";
import { IMembershipPlan } from "../../models/membershipPlanModel";
import { IWalletService } from "../interface/IWalletService";
import { IEmail } from "../../types/Email";

export class InstructorMembershipOrderService
  implements IInstructorMembershipOrderService
{
  private _membershipOrderRepo: IInstructorMembershipOrderRepository;
  private _planRepo: IInstructorMembershipRepository;
  private _instructorRepo: IInstructorRepository;
  private _razorpay: Razorpay;
  private _walletService: IWalletService;
  private _emailService: IEmail;

  constructor(
    membershipOrderRepo: IInstructorMembershipOrderRepository,
    planRepo: IInstructorMembershipRepository,
    instructorRepo: IInstructorRepository,
    razorpay: Razorpay,
    walletService: IWalletService,
    emailService: IEmail,
  ) {
    this._membershipOrderRepo = membershipOrderRepo;
    this._planRepo = planRepo;
    this._instructorRepo = instructorRepo;
    this._razorpay = razorpay;
    this._walletService = walletService;
    this._emailService = emailService;
  }

  async initiateCheckout(instructorId: string, planId: string) {
    const session: ClientSession = await startSession();
    session.startTransaction();

    try {
      const instructor = await this._instructorRepo.findById(instructorId);
      if (!instructor) throw new Error("Instructor not found");

      if (
        instructor.membershipExpiryDate &&
        new Date(instructor.membershipExpiryDate) > new Date()
      ) {
        throw new Error("You already have an active membership.");
      }

      const plan = (await this._planRepo.findById(planId)) as IMembershipPlan;
      if (!plan) throw new Error("Invalid plan");

      await session.commitTransaction();

      return {
        amount: plan.price,
        currency: "INR",
        planName: plan.name,
        durationInDays: plan.durationInDays,
        description: plan.description || "",
        benefits: plan.benefits || [],
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async createRazorpayOrder(instructorId: string, planId: string) {
    const session: ClientSession = await startSession();
    session.startTransaction();

    try {
      const instructor = await this._instructorRepo.findById(instructorId);
      if (!instructor) throw new Error("Instructor not found");

      if (
        instructor.membershipExpiryDate &&
        new Date(instructor.membershipExpiryDate) > new Date()
      ) {
        throw new Error("You already have an active membership.");
      }

      const plan = (await this._planRepo.findById(planId)) as IMembershipPlan;
      if (!plan) throw new Error("Invalid plan");

      const existingOrder = await this._membershipOrderRepo.findExistingOrder(
        instructorId,
        planId,
        session,
      );
      if (existingOrder) {
        if (existingOrder.paymentStatus === "pending") {
          throw new Error(
            `A pending order already exists for this plan (Order ID: ${existingOrder.orderId}). Please cancel it or wait 15 minutes before trying again.`,
          );
        } else {
          throw new Error("An order for this plan has already been paid.");
        }
      }

      const razorpayOrder = await this._razorpay.orders.create({
        amount: plan.price * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      await this._membershipOrderRepo.createOrder(
        {
          instructorId,
          planId: plan._id.toString(),
          razorpayOrderId: razorpayOrder.id,
          amount: plan.price,
          status: "pending",
        },
        session,
      );

      await session.commitTransaction();

      return {
        razorpayOrderId: razorpayOrder.id,
        amount: plan.price,
        currency: "INR",
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async retryFailedOrder(
    orderId: string,
    instructorId: string,
  ): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    planId: string;
  }> {
    const session: ClientSession = await startSession();
    session.startTransaction();

    try {
      const failedOrder =
        await this._membershipOrderRepo.findByOrderId(orderId);
      if (!failedOrder) {
        throw new Error("Order not found");
      }

      if (failedOrder.instructorId.toString() !== instructorId) {
        throw new Error("Unauthorized access");
      }

      if (failedOrder.paymentStatus !== "failed") {
        throw new Error("Only failed orders can be retried");
      }

      const instructor = await this._instructorRepo.findById(instructorId);
      if (!instructor) throw new Error("Instructor not found");

      if (
        instructor.membershipExpiryDate &&
        new Date(instructor.membershipExpiryDate) > new Date()
      ) {
        throw new Error("You already have an active membership.");
      }

      const plan = (await this._planRepo.findById(
        failedOrder.membershipPlanId.toString(),
      )) as IMembershipPlan;
      if (!plan) throw new Error("Invalid plan");

      const razorpayOrder = await this._razorpay.orders.create({
        amount: plan.price * 100,
        currency: "INR",
        receipt: `retry_${Date.now()}`,
      });

      await this._membershipOrderRepo.updateOrderStatus(
        orderId,
        {
          razorpayOrderId: razorpayOrder.id,
          paymentStatus: "pending",
          startDate: undefined,
          endDate: undefined,
        },
        session,
      );

      await session.commitTransaction();

      return {
        razorpayOrderId: razorpayOrder.id,
        amount: plan.price,
        currency: "INR",
        planId: plan._id.toString(),
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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
    const session: ClientSession = await startSession();
    session.startTransaction();

    try {
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

      const order =
        await this._membershipOrderRepo.findByRazorpayOrderId(razorpayOrderId);
      if (!order || order.paymentStatus === "paid") {
        throw new Error("Order not found or already processed");
      }

      const plan = (await this._planRepo.findById(planId)) as IMembershipPlan;
      if (!plan || !plan.durationInDays || !plan._id) {
        throw new Error("Invalid membership plan");
      }

      const now = new Date();
      const expiryDate = new Date(
        now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000,
      );

      await this._membershipOrderRepo.updateOrderStatus(
        order.orderId,
        {
          paymentStatus: "paid",
          startDate: now,
          endDate: expiryDate,
        },
        session,
      );

      await this._instructorRepo.update(
        instructorId,
        {
          isMentor: true,
          membershipExpiryDate: expiryDate,
          membershipPlanId: new Types.ObjectId(plan._id),
        },
        session,
      );

      await this._walletService.creditAdminWalletByEmail(
        process.env.ADMINEMAIL!,
        plan.price,
        `Instructor Membership (Razorpay): ${plan.name}`,
        order.orderId,
        { session },
      );

      await this._emailService.sendMembershipPurchaseEmail(
        instructor.username || "Instructor",
        instructor.email || "",
        plan.name,
        expiryDate,
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async purchaseWithWallet(
    instructorId: string,
    planId: string,
  ): Promise<void> {
    const session: ClientSession = await startSession();
    session.startTransaction();

    try {
      const instructor = await this._instructorRepo.findById(instructorId);
      if (!instructor) throw new Error("Instructor not found");

      if (
        instructor.membershipExpiryDate &&
        new Date(instructor.membershipExpiryDate) > new Date()
      ) {
        throw new Error("You already have an active membership.");
      }

      const plan = (await this._planRepo.findById(planId)) as IMembershipPlan;
      if (!plan || !plan._id) throw new Error("Membership plan not found");

      const amount = plan.price;
      const orderId = `wallet_membership_${Date.now()}`;

      const existingOrder = await this._membershipOrderRepo.findExistingOrder(
        instructorId,
        planId,
        session,
      );
      if (existingOrder) {
        if (existingOrder.paymentStatus === "pending") {
          throw new Error(
            `A pending order already exists for this plan (Order ID: ${existingOrder.orderId}). Please cancel it or wait 15 minutes before trying again.`,
          );
        } else {
          throw new Error("An order for this plan has already been paid.");
        }
      }

      const instructorWallet = await this._walletService.debitWallet(
        instructor._id.toString(),
        amount,
        `Membership Purchase: ${plan.name}`,
        orderId,
        { session },
      );

      if (!instructorWallet) {
        throw new Error("Insufficient wallet balance");
      }

      try {
        await this._walletService.creditAdminWalletByEmail(
          process.env.ADMINEMAIL!,
          amount,
          `Instructor Membership: ${plan.name}`,
          orderId,
          { session },
        );
      } catch (err) {
        await this._walletService.creditWallet(
          new Types.ObjectId(instructor._id.toString()),
          amount,
          `Refund: Failed admin credit`,
          `refund_${orderId}`,
          { session },
        );
        throw new Error("Admin credit failed. Transaction rolled back.");
      }

      const now = new Date();
      const expiry = new Date(
        now.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000,
      );

      await this._membershipOrderRepo.createOrder(
        {
          instructorId,
          planId: plan._id.toString(),
          razorpayOrderId: orderId,
          amount,
          status: "paid",
          startDate: now,
          endDate: expiry,
        },
        session,
      );

      await this._instructorRepo.update(
        instructorId,
        {
          isMentor: true,
          membershipExpiryDate: expiry,
          membershipPlanId: new Types.ObjectId(plan._id),
        },
        session,
      );

      await this._emailService.sendMembershipPurchaseEmail(
        instructor.username,
        instructor.email,
        plan.name,
        expiry,
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getInstructorOrders(
    instructorId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ data: InstructorMembershipOrderListDTO[]; total: number }> {
    const { data, total } =
      await this._membershipOrderRepo.findAllByInstructorId(
        instructorId,
        page,
        limit,
        search,
      );

    const dtoData: InstructorMembershipOrderListDTO[] = data.map((order) => ({
      orderId: order.orderId,
      planName: (order.membershipPlanId as any).name,
      amount: order.price,
      status: order.paymentStatus,
      purchaseDate: order.createdAt,
    }));

    return { data: dtoData, total };
  }

  async getOrderByOrderId(
    orderId: string,
    instructorId: string,
  ): Promise<InstructorMembershipOrderDTO | null> {
    const order = await this._membershipOrderRepo.findOneByOrderId(orderId);
    if (!order) throw new Error("Order not found");

    const orderInstructorId = (order.instructorId as any)._id.toString();

    if (orderInstructorId !== instructorId.toString()) {
      throw new Error("Unauthorized access");
    }

    return {
      orderId: order.orderId,
      instructor: {
        name: (order.instructorId as any).username,
        email: (order.instructorId as any).email,
      },
      membershipPlan: {
        name: (order.membershipPlanId as any).name,
        durationInDays: (order.membershipPlanId as any).durationInDays,
        description: (order.membershipPlanId as any).description,
        benefits: (order.membershipPlanId as any).benefits || [],
      },
      price: order.price,
      paymentStatus: order.paymentStatus,
      startDate: order.startDate,
      endDate: order.endDate,
      razorpayOrderId: order.razorpayOrderId, // Updated from txnId to orderId
      createdAt: order.createdAt,
    };
  }

  async cancelOrder(orderId: string, instructorId: string): Promise<void> {
    const session: ClientSession = await startSession();
    session.startTransaction();

    try {
      console.log("orderId", orderId);

      const order = await this._membershipOrderRepo.findByOrderId(orderId);

      if (!order) {
        throw new Error("Order not found");
      }
      if (order.instructorId.toString() !== instructorId) {
        throw new Error("Unauthorized access");
      }
      if (order.paymentStatus !== "pending") {
        throw new Error("Only pending orders can be cancelled");
      }

      const razorpayOrder = await this._razorpay.orders.fetch(
        order.razorpayOrderId,
      );
      if (razorpayOrder.status === "paid") {
        throw new Error("Order has already been paid on Razorpay");
      }

      await this._membershipOrderRepo.cancelOrder(orderId, session);
      await session.commitTransaction();
      console.log(`Order ${orderId} cancelled for instructor ${instructorId}`);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async markOrderAsFailed(
    orderId: string,
    instructorId: string,
  ): Promise<void> {
    const session: ClientSession = await startSession();
    session.startTransaction();

    try {
      const order =
        await this._membershipOrderRepo.findByRazorpayOrderId(orderId);

      console.log("razorpayOrderId", orderId);
      console.log("order", order);

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.instructorId.toString() !== instructorId) {
        throw new Error("Unauthorized access");
      }

      if (order.paymentStatus !== "pending") {
        throw new Error("Order is not in pending status");
      }

      await this._membershipOrderRepo.updateOrderStatus(
        order.orderId,
        {
          paymentStatus: "failed",
        },
        session,
      );

      await session.commitTransaction();
      console.log(
        `Order ${order.orderId} marked as failed for instructor ${instructorId}`,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
