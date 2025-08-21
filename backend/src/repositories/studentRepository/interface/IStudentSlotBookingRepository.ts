import { IBooking } from "../../../models/bookingModel";
import { PopulateOptions } from "mongoose";

export interface IStudentSlotBookingRepository {
  createBooking(booking: Partial<IBooking>): Promise<IBooking>;
  updateBookingStatus(id: string, update: Partial<IBooking>): Promise<void>;
  findBookingById(
    id: string,
    populate?: PopulateOptions[]
  ): Promise<IBooking | null>;
  findOne(
    filter: object,
    populate?: PopulateOptions[]
  ): Promise<IBooking | null>; // ✅ Add this

  findAllBookingsByStudentPaginated(
    studentId: string,
    page: number,
    limit: number,
    searchQuery?:string,
    populate?: PopulateOptions[]
  ): Promise<{ data: IBooking[]; total: number }>;
}