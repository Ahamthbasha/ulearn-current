import { IStudentSlotBookingService } from "../interface/IStudentSlotBookingService";
import { IStudentSlotBookingRepository } from "../../repositories/interfaces/IStudentSlotBookingRepository";
import { IStudentSlotRepository } from "../../repositories/interfaces/IStudentSlotRepository";
import { razorpay } from "../../utils/razorpay";
import { Types } from "mongoose";
import { IWalletService } from "../interface/IWalletService";
import { ISlot } from "../../models/slotModel";
import { IInstructor } from "../../models/instructorModel";
import { IBooking } from "../../models/bookingModel";

export class StudentSlotBookingService implements IStudentSlotBookingService {
  constructor(
    private bookingRepo: IStudentSlotBookingRepository,
    private slotRepo: IStudentSlotRepository,
    private walletService: IWalletService
  ) {}

  async initiateCheckout(slotId: string, studentId: string) {
    if (!Types.ObjectId.isValid(slotId)) throw new Error("Invalid slot ID");
    if (!Types.ObjectId.isValid(studentId))
      throw new Error("Invalid student ID");

    const slot = await this.slotRepo.findById(slotId);
    if (!slot) throw new Error("Slot not found");
    if (slot.isBooked) throw new Error("Slot already booked");

    // ✅ Check if a pending booking already exists
    const existing = await this.bookingRepo.findOne(
      {
        studentId: new Types.ObjectId(studentId),
        slotId: new Types.ObjectId(slotId),
        paymentStatus: "pending",
      },
      [{ path: "slotId" }, { path: "instructorId", select: "username email" }]
    );

    const booking =
      existing ||
      (await this.bookingRepo.createBooking({
        studentId: new Types.ObjectId(studentId),
        instructorId: slot.instructorId,
        slotId: slot._id as Types.ObjectId,
        status: "confirmed",
        paymentStatus: "pending",
      }));

    const populatedBooking = existing
      ? existing
      : await this.bookingRepo.findBookingById(booking._id.toString(), [
          { path: "slotId" },
          { path: "instructorId", select: "username email" },
        ]);

    if (!populatedBooking) throw new Error("Failed to populate booking");

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(slot.price * 100),
      currency: "INR",
      receipt: booking._id.toString(),
      payment_capture: true,
    });

    return {
      booking: populatedBooking,
      razorpayOrder,
    };
  }

  async updatePaymentStatus(
    bookingId: string,
    status: "paid" | "failed",
    txnId: string
  ): Promise<void> {
    if (!Types.ObjectId.isValid(bookingId))
      throw new Error("Invalid booking ID");

    const booking = await this.bookingRepo.findBookingById(bookingId, [
      { path: "slotId" },
      { path: "instructorId", select: "username email" },
    ]);

    if (!booking) throw new Error("Booking not found");

    if (status === "paid") {
      const slot = booking.slotId as ISlot;
      if (!slot) throw new Error("Slot not populated");
      if (slot.isBooked) throw new Error("Slot already marked booked");

      await this.slotRepo.update(slot._id.toString(), { isBooked: true });

      const instructorId = (booking.instructorId as IInstructor)._id;
      const amount = slot.price;

      await this.walletService.creditWallet(
        new Types.ObjectId(instructorId.toString()),
        amount,
        `Slot booking payment from student`,
        txnId
      );
    }

    await this.bookingRepo.updateBookingStatus(bookingId, {
      paymentStatus: status,
      txnId,
    });
  }

  async bookViaWallet(slotId: string, studentId: string): Promise<IBooking> {
    if (!Types.ObjectId.isValid(slotId) || !Types.ObjectId.isValid(studentId)) {
      throw new Error("Invalid IDs");
    }

    const slot = await this.slotRepo.findById(slotId);
    if (!slot) throw new Error("Slot not found");
    if (slot.isBooked) throw new Error("Slot already booked");

    // ✅ Check for existing paid or pending booking
    const existing = await this.bookingRepo.findOne({
      studentId: new Types.ObjectId(studentId),
      slotId: new Types.ObjectId(slotId),
    });

    if (existing) {
      if (existing.paymentStatus === "paid") {
        throw new Error("You have already booked this slot.");
      }
      if (existing.paymentStatus === "pending") {
        throw new Error(
          "You have already initiated booking. Please complete the payment."
        );
      }
    }

    const amount = slot.price;
    const txnId = `wallet-slot-${Date.now()}`;

    // 💸 Deduct from student's wallet
    await this.walletService.debitWallet(
      new Types.ObjectId(studentId),
      amount,
      `Slot booking payment to instructor`,
      txnId
    );

    // 💰 Credit to instructor's wallet
    await this.walletService.creditWallet(
      new Types.ObjectId(slot.instructorId.toString()),
      amount,
      `Slot booked by student`,
      txnId
    );

    // ✅ Mark slot as booked
    await this.slotRepo.update(slotId, { isBooked: true });

    // 📦 Create booking
    const booking = await this.bookingRepo.createBooking({
      studentId: new Types.ObjectId(studentId),
      instructorId: slot.instructorId,
      slotId: slot._id,
      status: "confirmed",
      paymentStatus: "paid",
      txnId,
    });

    return booking;
  }

  async getStudentBookingHistory(studentId: string): Promise<IBooking[]> {
    return await this.bookingRepo.findAllBookingsByStudent(studentId, [
      { path: "slotId" },
      { path: "instructorId", select: "username email" },
    ]);
  }

  async getStudentBookingById(bookingId: string): Promise<IBooking | null> {
    if (!Types.ObjectId.isValid(bookingId))
      throw new Error("Invalid booking ID");

    return await this.bookingRepo.findBookingById(bookingId, [
      { path: "slotId" },
      { path: "instructorId", select: "username email" },
      { path: "studentId", select: "username email" },
    ]);
  }
}
