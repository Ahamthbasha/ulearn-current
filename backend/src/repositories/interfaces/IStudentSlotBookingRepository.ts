import { IBooking } from "../../models/bookingModel";
import { PopulateOptions } from "mongoose";

export interface IStudentSlotBookingRepository {
  createBooking(booking: Partial<IBooking>): Promise<IBooking>;
  updateBookingStatus(id: string, update: Partial<IBooking>): Promise<void>;
  findBookingById(id: string, populate?: PopulateOptions[]): Promise<IBooking | null>;
  findOne(filter: object, populate?: PopulateOptions[]): Promise<IBooking | null>; // ✅ Add this

  findAllBookingsByStudent(
  studentId: string,
  populate?: PopulateOptions[]
): Promise<IBooking[]>;

}
