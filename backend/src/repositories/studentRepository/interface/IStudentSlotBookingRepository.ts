import { Types, ClientSession, PopulateOptions } from "mongoose";
import { IBooking } from "../../../models/bookingModel";

export interface IStudentSlotBookingRepository {
  createBooking(
    booking: Partial<IBooking>,
    session?: ClientSession
  ): Promise<IBooking>;
  updateBookingStatus(
    id: string,
    update: Partial<IBooking>,
    session?: ClientSession
  ): Promise<void>;
  findBookingById(
    id: string,
    populate?: PopulateOptions[],
    session?: ClientSession
  ): Promise<IBooking | null>;
  findOne(
    filter: object,
    populate?: PopulateOptions[],
    session?: ClientSession
  ): Promise<IBooking | null>;
  findAllBookingsByStudentPaginated(
    studentId: string,
    page: number,
    limit: number,
    searchQuery?: string,
    populate?: PopulateOptions[]
  ): Promise<{ data: IBooking[]; total: number }>;
  markStalePendingBookingsAsFailed(
    slotId: Types.ObjectId,
    session?: ClientSession
  ): Promise<void>;
}