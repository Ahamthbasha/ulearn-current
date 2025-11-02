import { IInstructorSlotBookingService } from "./interface/IInstructorSlotBookingService";
import { IInstructorSlotBookingRepository } from "../../repositories/instructorRepository/interface/IInstructorSlotBookingRepository";
import { Types } from "mongoose";
import createHttpError from "http-errors";
import { IBooking } from "../../models/bookingModel";
import { IInstructor } from "../../models/instructorModel";

export class InstructorSlotBookingService
  implements IInstructorSlotBookingService
{
  private _bookingRepo: IInstructorSlotBookingRepository;
  constructor(bookingRepo: IInstructorSlotBookingRepository) {
    this._bookingRepo = bookingRepo;
  }

  async getBookingDetail(
  instructorId: Types.ObjectId,
  slotId: Types.ObjectId,
): Promise<IBooking> {
  const booking = await this._bookingRepo.getBookingDetail(slotId);
  if (!booking) throw createHttpError.NotFound("Booking not found");

  const bookingInstructorId = booking.instructorId instanceof Types.ObjectId
    ? booking.instructorId
    : (booking.instructorId as IInstructor)._id;

  if (!bookingInstructorId) {
    throw createHttpError.Forbidden("Access denied to booking detail");
  }

  if (bookingInstructorId.toString() !== instructorId.toString()) {
    throw createHttpError.Forbidden("Access denied to booking detail");
  }

  return booking;
}
}
