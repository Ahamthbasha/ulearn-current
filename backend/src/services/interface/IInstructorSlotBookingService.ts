import { Types } from "mongoose";
import { IBooking } from "../../models/bookingModel";

export interface IInstructorSlotBookingService {
  getBookingDetail(instructorId: Types.ObjectId, slotId: Types.ObjectId): Promise<IBooking>;
}
