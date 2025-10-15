import { SlotDTO } from "src/dto/instructorDTO/slotDTO";
import { ISlot } from "../../../models/slotModel";
import { Types } from "mongoose";

export interface IInstructorSlotService {
  createSlot(
    instructorId: Types.ObjectId,
    startTime: Date | { slots: { startTime: Date; endTime: Date; price: number }[]; repetitionMode: string },
    endTime?: Date,
    price?: number,
  ): Promise<ISlot | ISlot[]>;
  updateSlot(
    instructorId: Types.ObjectId,
    slotId: Types.ObjectId,
    data: Partial<ISlot>,
  ): Promise<ISlot>;
  deleteSlot(
    instructorId: Types.ObjectId,
    slotId: Types.ObjectId,
  ): Promise<void>;
  listSlots(instructorId: Types.ObjectId, date?: string): Promise<SlotDTO[]>;
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
  deleteUnbookedSlotsForDate(
    instructorId: Types.ObjectId,
    date: string
  ): Promise<void>;
}