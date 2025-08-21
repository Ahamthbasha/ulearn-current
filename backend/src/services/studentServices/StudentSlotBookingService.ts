import { IStudentSlotBookingService } from "./interface/IStudentSlotBookingService";
import { IStudentSlotBookingRepository } from "../../repositories/studentRepository/interface/IStudentSlotBookingRepository";
import { IStudentSlotRepository } from "../../repositories/studentRepository/interface/IStudentSlotRepository";
import { razorpay } from "../../utils/razorpay";
import { Types } from "mongoose";
import { IWalletService } from "../interface/IWalletService";
import { IBooking } from "../../models/bookingModel";
import { IInstructor } from "../../models/instructorModel";
import { PopulatedSlot } from "../../types/PopulatedSlot";
import { PopulatedBooking } from "../../types/PopulatedBooking";
import { SendEmail } from "../../utils/sendOtpEmail";
import { format } from "date-fns";
import { toStudentSlotBookingHistoryDTO } from "../../mappers/userMapper/studentSlotBookingMapper";
import { toStudentBookingDetailDTO } from "../../mappers/userMapper/studentBookingDetailMapper";
import { StudentSlotBookingHistoryDTO } from "../../dto/userDTO/StudentSlotBookingHistoryDTO";
import { StudentBookingDetailDTO } from "../../dto/userDTO/studentBookingDetailDTO";

export class StudentSlotBookingService implements IStudentSlotBookingService {
  private _emailService: SendEmail;
  private _bookingRepo: IStudentSlotBookingRepository;
  private _slotRepo: IStudentSlotRepository;
  private _walletService: IWalletService;
  constructor(
    bookingRepo: IStudentSlotBookingRepository,
    slotRepo: IStudentSlotRepository,
    walletService: IWalletService,
  ) {
    this._bookingRepo = bookingRepo;
    this._slotRepo = slotRepo;
    this._walletService = walletService;
    this._emailService = new SendEmail();
  }

  async initiateCheckout(slotId: string, studentId: string) {
    if (!Types.ObjectId.isValid(slotId)) throw new Error("Invalid slot ID");
    if (!Types.ObjectId.isValid(studentId))
      throw new Error("Invalid student ID");

    const slot = (await this._slotRepo.findOne({ _id: slotId }, [
      { path: "instructorId", select: "username email" },
    ])) as PopulatedSlot;

    if (!slot) throw new Error("Slot not found");
    if (slot.isBooked) throw new Error("Slot already booked");
    if (!slot.price || isNaN(slot.price)) throw new Error("Invalid slot price");

    const receipt = `slot-${slotId}-${studentId}-${Date.now()}`.substring(
      0,
      40,
    );

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(slot.price * 100),
      currency: "INR",
      receipt,
      payment_capture: true,
    });

    return {
      booking: {
        slotId: slot,
        instructorId: slot.instructorId as IInstructor,
      },
      razorpayOrder,
    };
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

    const slot = await this._slotRepo.findById(slotId);
    if (!slot) throw new Error("Slot not found");
    if (slot.isBooked) throw new Error("Slot already booked");

    await this._slotRepo.update(slot._id.toString(), { isBooked: true });

    await this._walletService.creditWallet(
      new Types.ObjectId(slot.instructorId.toString()),
      slot.price,
      `Slot booking payment from student`,
      razorpayPaymentId,
    );

    const booking = await this._bookingRepo.createBooking({
      studentId: new Types.ObjectId(studentId),
      instructorId: slot.instructorId,
      slotId: slot._id,
      status: "confirmed",
      paymentStatus: "paid",
      txnId: razorpayPaymentId,
    });

    const updatedBooking = await this._bookingRepo.findBookingById(
      booking._id.toString(),
      [
        { path: "slotId" },
        { path: "instructorId", select: "username email" },
        { path: "studentId", select: "username email" },
      ],
    );

    if (!updatedBooking) throw new Error("Failed to fetch updated booking");

    const populated = updatedBooking as PopulatedBooking;

    await this._emailService.sendSlotBookingConfirmation(
      populated.studentId.username,
      populated.studentId.email,
      populated.instructorId.username,
      format(new Date(populated.slotId.startTime), "dd/MM/yyyy"),
      format(new Date(populated.slotId.startTime), "hh:mm a"),
      format(new Date(populated.slotId.endTime), "hh:mm a"),
    );

    return populated;
  }

  async bookViaWallet(slotId: string, studentId: string): Promise<IBooking> {
    if (!Types.ObjectId.isValid(slotId) || !Types.ObjectId.isValid(studentId)) {
      throw new Error("Invalid IDs");
    }

    const slot = await this._slotRepo.findById(slotId);
    if (!slot) throw new Error("Slot not found");
    if (slot.isBooked) throw new Error("Slot already booked");

    const amount = slot.price;
    const txnId = `wallet-slot-${Date.now()}`;

    await this._walletService.debitWallet(
      new Types.ObjectId(studentId),
      amount,
      `Slot booking payment to instructor`,
      txnId,
    );

    await this._walletService.creditWallet(
      new Types.ObjectId(slot.instructorId.toString()),
      amount,
      `Slot booked by student`,
      txnId,
    );

    await this._slotRepo.update(slotId, { isBooked: true });

    const booking = await this._bookingRepo.createBooking({
      studentId: new Types.ObjectId(studentId),
      instructorId: slot.instructorId,
      slotId: slot._id,
      status: "confirmed",
      paymentStatus: "paid",
      txnId,
    });

    const updatedBooking = await this._bookingRepo.findBookingById(
      booking._id.toString(),
      [
        { path: "slotId" },
        { path: "instructorId", select: "username email" },
        { path: "studentId", select: "username email" },
      ],
    );

    if (!updatedBooking) throw new Error("Failed to fetch updated booking");

    const populated = updatedBooking as PopulatedBooking;

    await this._emailService.sendSlotBookingConfirmation(
      populated.studentId.username,
      populated.studentId.email,
      populated.instructorId.username,
      format(new Date(populated.slotId.startTime), "dd/MM/yyyy"),
      format(new Date(populated.slotId.startTime), "hh:mm a"),
      format(new Date(populated.slotId.endTime), "hh:mm a"),
    );

    return populated;
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

    // Map to DTOs in service layer
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

    // Map to DTO in service layer
    return toStudentBookingDetailDTO(booking as PopulatedBooking);
  }
}
