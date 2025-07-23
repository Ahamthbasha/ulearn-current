import { Types } from "mongoose";
import { IBooking } from "../../models/bookingModel";

export interface IInstructorSlotBookingRepository {
  getBookingDetail(slotId: Types.ObjectId): Promise<IBooking | null>;
}
