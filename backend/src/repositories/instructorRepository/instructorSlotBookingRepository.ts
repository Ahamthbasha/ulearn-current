import { BookingModel, IBooking } from "../../models/bookingModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorSlotBookingRepository } from "./interface/IInstructorSlotBookingRepository";
import { Types } from "mongoose";

export class InstructorSlotBookingRepository
  extends GenericRepository<IBooking>
  implements IInstructorSlotBookingRepository
{
  constructor() {
    super(BookingModel);
  }

  async getBookingDetail(slotId: Types.ObjectId): Promise<IBooking | null> {
    const populateOptions = [
      { path: "studentId", select: "username email" },
      { path: "instructorId", select: "username email" },
      { path: "slotId" },
    ];

    return await this.findOne({ slotId }, populateOptions);
  }
}
