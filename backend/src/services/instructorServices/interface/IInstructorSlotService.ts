import { ISlot } from "../../../models/slotModel";
import { Types } from "mongoose";

export interface IInstructorSlotService {
  createSlot(
    instructorId: Types.ObjectId,
    startTime: Date,
    endTime: Date,
    price: number,
  ): Promise<ISlot>;
  updateSlot(
    instructorId: Types.ObjectId,
    slotId: Types.ObjectId,
    data: Partial<ISlot>,
  ): Promise<ISlot>;
  deleteSlot(
    instructorId: Types.ObjectId,
    slotId: Types.ObjectId,
  ): Promise<void>;
  listSlots(instructorId: Types.ObjectId): Promise<ISlot[]>;

  getSlotStats(
    instructorId: Types.ObjectId,
    mode: "monthly" | "yearly" | "custom",
    options: {
      month?: number;
      year?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<
    {
      date: string;
      totalSlots: number;
      bookedSlots: number;
    }[]
  >;
}
