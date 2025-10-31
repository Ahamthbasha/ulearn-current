import { IStudentSlotBookingService } from "./interface/IStudentSlotBookingService";
import { IStudentSlotBookingRepository } from "../../repositories/studentRepository/interface/IStudentSlotBookingRepository";
import { IStudentSlotRepository } from "../../repositories/studentRepository/interface/IStudentSlotRepository";
import { razorpay } from "../../utils/razorpay";
import { Types } from "mongoose";
import { IWalletService } from "../interface/IWalletService";
import { IBooking } from "../../models/bookingModel";
import { IInstructor, isInstructor } from "../../models/instructorModel";
import { PopulatedSlot } from "../../types/PopulatedSlot";
import { PopulatedBooking } from "../../types/PopulatedBooking";
import { format } from "date-fns";
import { toStudentSlotBookingHistoryDTO } from "../../mappers/userMapper/studentSlotBookingMapper";
import { toStudentBookingDetailDTO } from "../../mappers/userMapper/studentBookingDetailMapper";
import { StudentSlotBookingHistoryDTO } from "../../dto/userDTO/StudentSlotBookingHistoryDTO";
import { StudentBookingDetailDTO } from "../../dto/userDTO/studentBookingDetailDTO";
import { IEmail } from "../../types/Email";
import { ISlot } from "../../models/slotModel";
import mongoose from "mongoose";
import { SlotAvailabilityResult } from "../../types/ISlotAvailabilityResult";
import { IRazorpayOrder } from "../../types/razorpay";

export class StudentSlotBookingService implements IStudentSlotBookingService {
  private _emailService: IEmail;
  private _bookingRepo: IStudentSlotBookingRepository;
  private _slotRepo: IStudentSlotRepository;
  private _walletService: IWalletService;

  constructor(
    bookingRepo: IStudentSlotBookingRepository,
    slotRepo: IStudentSlotRepository,
    walletService: IWalletService,
    emailService: IEmail,
  ) {
    this._bookingRepo = bookingRepo;
    this._slotRepo = slotRepo;
    this._walletService = walletService;
    this._emailService = emailService;
  }

  async initiateCheckout(slotId: string, studentId: string): Promise<{
  booking: {
    slotId: ISlot;
    instructorId: IInstructor;
    bookingId: string;
  };
  razorpayOrder: IRazorpayOrder;
}> {
  if (!Types.ObjectId.isValid(slotId)) throw new Error("Invalid slot ID");
  if (!Types.ObjectId.isValid(studentId)) throw new Error("Invalid student ID");

  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      await this._bookingRepo.markStalePendingBookingsAsFailed(
        new Types.ObjectId(slotId),
        session,
      );

      const availability = await this.checkSlotAvailabilityForStudent(slotId, studentId);
      if (!availability.available) {
        if (availability.reason === "PENDING_BOOKING_EXISTS") {
          throw new Error(`PENDING_BOOKING_EXISTS:${availability.bookingId}`);
        } else if (availability.reason === "PENDING_BOOKING_BY_OTHERS") {
          throw new Error("PENDING_BOOKING_BY_OTHERS");
        } else if (availability.reason === "SLOT_ALREADY_BOOKED") {
          throw new Error("SLOT_ALREADY_BOOKED");
        } else {
          throw new Error(availability.message || "Slot not available");
        }
      }

      const slot = availability.slot as ISlot;
      if (!slot) throw new Error("Slot not found");
      if (!slot.price || isNaN(slot.price)) throw new Error("Invalid slot price");
      if (typeof slot.instructorId === "string") throw new Error("Instructor not populated");
      const receipt: string = `slot-${slotId}-${studentId}-${Date.now()}`.substring(0, 40);

const rawRazorpayOrder = await razorpay.orders.create({
  amount: Math.round(slot.price * 100),
  currency: "INR",
  receipt,
  payment_capture: true,
});

// Map to IRazorpayOrder ...
const razorpayOrder: IRazorpayOrder = {
  id: rawRazorpayOrder.id,
  entity: rawRazorpayOrder.entity,
  amount: typeof rawRazorpayOrder.amount === "string" ? parseInt(rawRazorpayOrder.amount, 10) : rawRazorpayOrder.amount,
  amount_paid: typeof rawRazorpayOrder.amount_paid === "string" ? parseInt(rawRazorpayOrder.amount_paid, 10) : rawRazorpayOrder.amount_paid,
  amount_due: typeof rawRazorpayOrder.amount_due === "string" ? parseInt(rawRazorpayOrder.amount_due, 10) : rawRazorpayOrder.amount_due,
  currency: rawRazorpayOrder.currency,
  receipt: receipt,
  status: rawRazorpayOrder.status,
  attempts: rawRazorpayOrder.attempts,
  created_at: rawRazorpayOrder.created_at,
};

if (!isInstructor(slot.instructorId)) {
  throw new Error("Instructor not populated");
}

const pendingBooking = await this._bookingRepo.createBooking(
  {
    studentId: new Types.ObjectId(studentId),
    instructorId: slot.instructorId,
    slotId: slot._id,
    status: "pending",
    paymentStatus: "pending",
  },
  session,
);

return {
  booking: {
    slotId: slot,
    instructorId: slot.instructorId,
    bookingId: pendingBooking._id.toString(),
  },
  razorpayOrder,
};

    });
  } finally {
    await session.endSession();
  }
}


  async verifyPayment(
    slotId: string,
    studentId: string,
    razorpayPaymentId: string,
  ): Promise<IBooking> {
    if (!Types.ObjectId.isValid(slotId) || !Types.ObjectId.isValid(studentId)) {
      throw new Error("Invalid IDs");
    }

    if (!razorpayPaymentId) throw new Error("Missing Razorpay payment ID");

    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(async () => {
        // Mark stale pending bookings as failed
        await this._bookingRepo.markStalePendingBookingsAsFailed(
          new Types.ObjectId(slotId),
          session,
        );

        // Fetch slot with lock
        const slot = await this._slotRepo.getSlotByIdWithLock(slotId, session);
        if (!slot) throw new Error("Slot not found");
        if (slot.isBooked) throw new Error("Slot already booked");
        if (!slot.price || isNaN(slot.price))
          throw new Error("Invalid slot price");

        // Check for existing confirmed booking
        const confirmedBooking = await this._bookingRepo.findOne(
          {
            slotId: new Types.ObjectId(slotId),
            status: "confirmed",
          },
          [],
          session,
        );
        if (confirmedBooking)
          throw new Error("Slot already booked by another user");

        // Find the pending booking for this student and slot
        const pendingBooking = await this._bookingRepo.findOne(
          {
            slotId: new Types.ObjectId(slotId),
            studentId: new Types.ObjectId(studentId),
            status: "pending",
            paymentStatus: "pending",
          },
          [],
          session,
        );
        if (!pendingBooking) throw new Error("Pending booking not found");

        // Mark slot as booked
        await this._slotRepo.updateWithSession(
          slot._id.toString(),
          { isBooked: true },
          session,
        );

        // Credit instructor wallet
        await this._walletService.creditWallet(
          new Types.ObjectId(slot.instructorId.toString()),
          slot.price,
          `Slot booking payment from student`,
          razorpayPaymentId,
          { session },
        );

        // Update booking to confirmed
        await this._bookingRepo.updateBookingStatus(
          pendingBooking._id.toString(),
          {
            status: "confirmed",
            paymentStatus: "paid",
            txnId: razorpayPaymentId,
          },
          session,
        );


        const updatedBooking = await this._bookingRepo.findBookingById(
          pendingBooking._id.toString(),
          [
            { path: "slotId" },
            { path: "instructorId", select: "username email" },
            { path: "studentId", select: "username email" },
          ],
          session,
        );

        if (!updatedBooking) throw new Error("Failed to fetch updated booking");

        const populated = updatedBooking as PopulatedBooking;

        // Send confirmation email
        await this._emailService.sendSlotBookingConfirmation(
          populated.studentId.username,
          populated.studentId.email,
          populated.instructorId.username,
          format(new Date(populated.slotId.startTime), "dd/MM/yyyy"),
          format(new Date(populated.slotId.startTime), "hh:mm a"),
          format(new Date(populated.slotId.endTime), "hh:mm a"),
        );

        return populated;
      });
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async verifyRetryPayment(
    bookingId: string,
    studentId: string,
    razorpayPaymentId: string,
  ): Promise<IBooking> {
    if (
      !Types.ObjectId.isValid(bookingId) ||
      !Types.ObjectId.isValid(studentId)
    ) {
      throw new Error("Invalid IDs");
    }

    if (!razorpayPaymentId) throw new Error("Missing Razorpay payment ID");

    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(async () => {
        // Find the specific pending booking for retry
        const pendingBooking = await this._bookingRepo.findOne(
          {
            _id: new Types.ObjectId(bookingId),
            studentId: new Types.ObjectId(studentId),
            status: "pending",
            paymentStatus: "pending",
          },
          [
            { path: "slotId" },
            { path: "instructorId", select: "username email" },
            { path: "studentId", select: "username email" },
          ],
          session,
        );

        if (!pendingBooking)
          throw new Error("Retry booking not found or already processed");

        const populated = pendingBooking as PopulatedBooking;
        const slot = populated.slotId as PopulatedSlot;

        if (!slot || typeof slot === "string")
          throw new Error("Slot not populated");
        if (slot.isBooked)
          throw new Error("Slot already booked by another user");
        if (!slot.price || isNaN(slot.price))
          throw new Error("Invalid slot price");
        const confirmedBooking = await this._bookingRepo.findOne(
          {
            slotId: new Types.ObjectId(slot._id.toString()),
            status: "confirmed",
            _id: { $ne: new Types.ObjectId(bookingId) }, // Exclude current booking
          },
          [],
          session,
        );
        if (confirmedBooking)
          throw new Error("Slot already booked by another user");

        // Mark slot as booked
        await this._slotRepo.updateWithSession(
          slot._id.toString(),
          { isBooked: true },
          session,
        );

        // Credit instructor wallet
        await this._walletService.creditWallet(
          new Types.ObjectId(slot.instructorId.toString()),
          slot.price,
          `Slot booking payment from student (retry)`,
          razorpayPaymentId,
          { session },
        );

        // Update booking to confirmed
        await this._bookingRepo.updateBookingStatus(
          bookingId,
          {
            status: "confirmed",
            paymentStatus: "paid",
            txnId: razorpayPaymentId,
          },
          session,
        );

        // Fetch updated booking with population
        const updatedBooking = await this._bookingRepo.findBookingById(
          bookingId,
          [
            { path: "slotId" },
            { path: "instructorId", select: "username email" },
            { path: "studentId", select: "username email" },
          ],
          session,
        );

        if (!updatedBooking) throw new Error("Failed to fetch updated booking");

        const finalPopulated = updatedBooking as PopulatedBooking;

        // Send confirmation email
        await this._emailService.sendSlotBookingConfirmation(
          finalPopulated.studentId.username,
          finalPopulated.studentId.email,
          finalPopulated.instructorId.username,
          format(new Date(finalPopulated.slotId.startTime), "dd/MM/yyyy"),
          format(new Date(finalPopulated.slotId.startTime), "hh:mm a"),
          format(new Date(finalPopulated.slotId.endTime), "hh:mm a"),
        );

        return finalPopulated;
      });
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async bookViaWallet(slotId: string, studentId: string): Promise<IBooking> {
    if (!Types.ObjectId.isValid(slotId) || !Types.ObjectId.isValid(studentId)) {
      throw new Error("Invalid IDs");
    }

    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(async () => {
        // Mark stale pending bookings as failed
        await this._bookingRepo.markStalePendingBookingsAsFailed(
          new Types.ObjectId(slotId),
          session,
        );

        const availability = await this.checkSlotAvailabilityForStudent(
          slotId,
          studentId,
        );
        if (!availability.available) {
          if (availability.reason === "PENDING_BOOKING_EXISTS") {
            throw new Error(`PENDING_BOOKING_EXISTS:${availability.bookingId}`);
          } else if (availability.reason === "PENDING_BOOKING_BY_OTHERS") {
            throw new Error("PENDING_BOOKING_BY_OTHERS");
          } else if (availability.reason === "SLOT_ALREADY_BOOKED") {
            throw new Error("SLOT_ALREADY_BOOKED");
          } else {
            throw new Error(availability.message || "Slot not available");
          }
        }

        const slot = availability.slot;
        if (!slot) throw new Error("Slot not found");

        if (slot.isBooked) throw new Error("Slot already booked");
        if (!slot.price || isNaN(slot.price))
          throw new Error("Invalid slot price");

        const amount = slot.price;
        const txnId = `wallet-slot-${Date.now()}`;

        // Debit student wallet
        const debitResult = await this._walletService.debitWallet(
          new Types.ObjectId(studentId),
          amount,
          `Slot booking payment to instructor`,
          txnId,
          { session },
        );
        if (!debitResult) throw new Error("Insufficient wallet balance");

        // Credit instructor wallet
        await this._walletService.creditWallet(
          new Types.ObjectId(slot.instructorId._id.toString()),
          amount,
          `Slot booked by student`,
          txnId,
          { session },
        );

        // Mark slot as booked
        await this._slotRepo.updateWithSession(slotId, { isBooked: true }, session);

        // Create booking
        const booking = await this._bookingRepo.createBooking(
          {
            studentId: new Types.ObjectId(studentId),
            instructorId: slot.instructorId,
            slotId: slot._id,
            status: "confirmed",
            paymentStatus: "paid",
            txnId,
          },
          session,
        );

        // Fetch updated booking with population
        const updatedBooking = await this._bookingRepo.findBookingById(
          booking._id.toString(),
          [
            { path: "slotId" },
            { path: "instructorId", select: "username email" },
            { path: "studentId", select: "username email" },
          ],
          session,
        );

        if (!updatedBooking) throw new Error("Failed to fetch updated booking");

        const populated = updatedBooking as PopulatedBooking;

        // Send confirmation email
        await this._emailService.sendSlotBookingConfirmation(
          populated.studentId.username,
          populated.studentId.email,
          populated.instructorId.username,
          format(new Date(populated.slotId.startTime), "dd/MM/yyyy"),
          format(new Date(populated.slotId.startTime), "hh:mm a"),
          format(new Date(populated.slotId.endTime), "hh:mm a"),
        );

        return populated;
      });
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getStudentBookingHistoryPaginated(
    studentId: string,
    page: number,
    limit: number,
    searchQuery?: string,
  ): Promise<{ data: StudentSlotBookingHistoryDTO[]; total: number }> {
    const result = await this._bookingRepo.findAllBookingsByStudentPaginated(
      studentId,
      page,
      limit,
      searchQuery,
      [{ path: "slotId" }, { path: "instructorId", select: "username email" }],
    );

    const mappedData = result.data.map(toStudentSlotBookingHistoryDTO);

    return {
      data: mappedData,
      total: result.total,
    };
  }

  async getStudentBookingById(bookingId: string): Promise<IBooking | null> {
    if (!Types.ObjectId.isValid(bookingId))
      throw new Error("Invalid booking ID");

    return await this._bookingRepo.findBookingById(bookingId, [
      { path: "slotId" },
      { path: "instructorId", select: "username email" },
      { path: "studentId", select: "username email" },
    ]);
  }

  async getStudentBookingDetail(
    bookingId: string,
  ): Promise<StudentBookingDetailDTO | null> {
    if (!Types.ObjectId.isValid(bookingId))
      throw new Error("Invalid booking ID");

    const booking = await this._bookingRepo.findBookingById(bookingId, [
      { path: "slotId" },
      { path: "instructorId", select: "username email" },
      { path: "studentId", select: "username email" },
    ]);

    if (!booking) return null;

    return toStudentBookingDetailDTO(booking as PopulatedBooking);
  }

  async cancelPendingBooking(
    bookingId: string,
    studentId: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(bookingId))
      throw new Error("Invalid booking ID");
    if (!Types.ObjectId.isValid(studentId))
      throw new Error("Invalid student ID");

    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(async () => {
        // Find the pending booking
        const pendingBooking = await this._bookingRepo.findOne(
          {
            _id: new Types.ObjectId(bookingId),
            studentId: new Types.ObjectId(studentId),
            status: "pending",
          },
          [],
          session,
        );

        if (!pendingBooking) {
          throw new Error("Pending booking not found or already processed");
        }

        // Cancel the booking
        await this._bookingRepo.updateBookingStatus(
          bookingId,
          { status: "cancelled", paymentStatus: "failed" },
          session,
        );

        return true;
      });
    } finally {
      await session.endSession();
    }
  }

  async checkSlotAvailabilityForStudent(
    slotId: string,
    studentId: string,
  ): Promise<SlotAvailabilityResult> {
    if (!Types.ObjectId.isValid(slotId)) throw new Error("Invalid slot ID");
    if (!Types.ObjectId.isValid(studentId))
      throw new Error("Invalid student ID");

    await this._bookingRepo.markStalePendingBookingsAsFailed(
      new Types.ObjectId(slotId),
    );

    const confirmedBooking = await this._bookingRepo.findOne({
      slotId: new Types.ObjectId(slotId),
      status: "confirmed",
    });

    if (confirmedBooking) {
      return {
        available: false,
        reason: "SLOT_ALREADY_BOOKED",
        message: "This slot is already booked by another user",
      };
    }

    const pendingBookingByStudent = await this._bookingRepo.findOne({
      slotId: new Types.ObjectId(slotId),
      studentId: new Types.ObjectId(studentId),
      status: "pending",
    });

    if (pendingBookingByStudent) {
      return {
        available: false,
        reason: "PENDING_BOOKING_EXISTS",
        message: "You have a pending booking for this slot",
        bookingId: pendingBookingByStudent._id.toString(),
        createdAt: pendingBookingByStudent.createdAt,
      };
    }

    const pendingBookingByOthers = await this._bookingRepo.findOne({
      slotId: new Types.ObjectId(slotId),
      status: "pending",
      studentId: { $ne: new Types.ObjectId(studentId) },
    });

    if (pendingBookingByOthers) {
      return {
        available: false,
        reason: "PENDING_BOOKING_BY_OTHERS",
        message: "This slot is temporarily reserved by another user",
      };
    }

    const slot = (await this._slotRepo.findOne(
      { _id: slotId, isBooked: false },
      [{ path: "instructorId", select: "username email" }],
    )) as PopulatedSlot;

    if (!slot) {
      return {
        available: false,
        reason: "SLOT_NOT_FOUND",
        message: "Slot not found or already booked",
      };
    }

    return {
      available: true,
      slot: slot,
    };
  }

  async handlePaymentFailure(
    bookingId: string,
    studentId: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(bookingId))
      throw new Error("Invalid booking ID");
    if (!Types.ObjectId.isValid(studentId))
      throw new Error("Invalid student ID");

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Find the pending booking
        const pendingBooking = await this._bookingRepo.findOne(
          {
            _id: new Types.ObjectId(bookingId),
            studentId: new Types.ObjectId(studentId),
            status: "pending",
          },
          [],
          session,
        );

        if (!pendingBooking) {
          throw new Error("Pending booking not found or already processed");
        }

        // Update booking status to failed
        await this._bookingRepo.updateBookingStatus(
          bookingId,
          { status: "failed", paymentStatus: "failed" },
          session,
        );
      });
    } finally {
      await session.endSession();
    }
  }

  async retryPayment(
  bookingId: string,
  studentId: string,
): Promise<{
  booking: {
    slotId: ISlot;
    instructorId: IInstructor;
    bookingId: string;
  };
  razorpayOrder: IRazorpayOrder;
}> {
  if (!Types.ObjectId.isValid(bookingId))
    throw new Error("Invalid booking ID");
  if (!Types.ObjectId.isValid(studentId))
    throw new Error("Invalid student ID");

  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // Find the failed booking with populated fields
      const booking = await this._bookingRepo.findOne(
        {
          _id: new Types.ObjectId(bookingId),
          studentId: new Types.ObjectId(studentId),
          status: "failed",
        },
        [
          { path: "slotId" },
          { path: "instructorId", select: "username email" },
        ],
        session,
      );

      if (!booking) throw new Error("Failed booking not found");

      const slot = booking.slotId as ISlot;
      if (!slot || typeof slot === "string")
        throw new Error("Slot not populated");
      if (slot.isBooked) throw new Error("SLOT_ALREADY_BOOKED");

      // Mark stale pending bookings as failed
      await this._bookingRepo.markStalePendingBookingsAsFailed(
        new Types.ObjectId(slot._id.toString()),
        session,
      );

      // Check slot availability
      const availability = await this.checkSlotAvailabilityForStudent(
        slot._id.toString(),
        studentId,
      );
      if (!availability.available) {
        if (availability.reason === "PENDING_BOOKING_BY_OTHERS") {
          throw new Error("PENDING_BOOKING_BY_OTHERS");
        } else if (availability.reason === "SLOT_ALREADY_BOOKED") {
          throw new Error("SLOT_ALREADY_BOOKED");
        } else {
          throw new Error(availability.message || "Slot not available");
        }
      }

      if (!slot.price || isNaN(slot.price))
        throw new Error("Invalid slot price");
      
      if (!isInstructor(slot.instructorId))
        throw new Error("Instructor not populated");

      // Generate new Razorpay order
      const receipt = `retry-slot-${slot._id.toString()}-${studentId}-${Date.now()}`.substring(0, 40);

      const rawRazorpayOrder = await razorpay.orders.create({
        amount: Math.round(slot.price * 100),
        currency: "INR",
        receipt,
        payment_capture: true,
      });

      // Map raw order fields to IRazorpayOrder, ensuring proper types
      const razorpayOrder: IRazorpayOrder = {
        id: rawRazorpayOrder.id,
        entity: rawRazorpayOrder.entity,
        amount: typeof rawRazorpayOrder.amount === "string"
          ? parseInt(rawRazorpayOrder.amount, 10)
          : rawRazorpayOrder.amount,
        amount_paid: typeof rawRazorpayOrder.amount_paid === "string"
          ? parseInt(rawRazorpayOrder.amount_paid, 10)
          : rawRazorpayOrder.amount_paid,
        amount_due: typeof rawRazorpayOrder.amount_due === "string"
          ? parseInt(rawRazorpayOrder.amount_due, 10)
          : rawRazorpayOrder.amount_due,
        currency: rawRazorpayOrder.currency,
        receipt: receipt,
        status: rawRazorpayOrder.status,
        attempts: rawRazorpayOrder.attempts,
        created_at: rawRazorpayOrder.created_at,
      };

      // Update booking to pending status
      await this._bookingRepo.updateBookingStatus(
        bookingId,
        {
          status: "pending",
          paymentStatus: "pending",
          txnId: undefined,
        },
        session,
      );

      return {
        booking: {
          slotId: slot,
          instructorId: slot.instructorId,
          bookingId: booking._id.toString(),
        },
        razorpayOrder,
      };
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
}
}
