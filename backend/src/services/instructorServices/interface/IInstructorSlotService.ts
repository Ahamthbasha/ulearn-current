import { SlotDTO } from "../../../dto/instructorDTO/slotDTO";
import { ISlot } from "../../../models/slotModel";
import { Types } from "mongoose";

export interface IInstructorSlotService {
  createSlot(
    instructorId: Types.ObjectId,
    data: {
      startTime: Date;
      endTime: Date;
      price: number;
      recurrenceRule?: {
        daysOfWeek: number[];
        startDate: Date;
        endDate: Date;
      };
    },
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
    date: string,
  ): Promise<void>;
}
