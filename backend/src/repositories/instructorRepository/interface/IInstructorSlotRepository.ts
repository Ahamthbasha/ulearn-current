import { ISlot } from "../../../models/slotModel";
import { Types } from "mongoose";

export interface IInstructorSlotRepository {
  createSlot(data: Partial<ISlot>): Promise<ISlot>;
  createBulkSlots(data: Partial<ISlot>[]): Promise<ISlot[]>;
  updateSlot(slotId: Types.ObjectId, data: Partial<ISlot>): Promise<ISlot | null>;
  deleteSlot(slotId: Types.ObjectId): Promise<void>;
  getSlotById(slotId: Types.ObjectId): Promise<ISlot | null>;
  getSlotsByInstructor(instructorId: Types.ObjectId, date?: string): Promise<ISlot[]>;
  checkOverlap(
    instructorId: Types.ObjectId,
    startTime: Date,
    endTime: Date,
    excludeSlotId?: Types.ObjectId
  ): Promise<boolean>;
  getSlotStats(
    instructorId: Types.ObjectId,
    mode: "monthly" | "yearly" | "custom",
    options: {
      month?: number;
      year?: number;
      startDate?: Date;
      endDate?: Date;
    }
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