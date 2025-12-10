import { ISlot } from "../models/slotModel";
import { IBooking } from "../models/bookingModel";
import { IUser } from "../models/userModel";
import { IInstructor } from "../models/instructorModel";

export type PopulatedBooking = IBooking & {
  slotId: ISlot;
  instructorId: IInstructor;
  studentId: IUser;
};
