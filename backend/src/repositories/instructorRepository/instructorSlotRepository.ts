import { IInstructorSlotRepository } from "./interface/IInstructorSlotRepository";
import SlotModel, { ISlot } from "../../models/slotModel";
import { FilterQuery, Types } from "mongoose";
import { GenericRepository } from "../genericRepository";
import { fromZonedTime } from "date-fns-tz";
import { getISTDayRangeUTC } from "../../utils/timezone";

const IST_TIMEZONE = "Asia/Kolkata";

export class InstructorSlotRepository
  extends GenericRepository<ISlot>
  implements IInstructorSlotRepository
{
  constructor() {
    super(SlotModel);
  }

  async createSlot(data: Partial<ISlot>): Promise<ISlot> {
    return await this.create(data);
  }

  async createBulkSlots(data: Partial<ISlot>[]): Promise<ISlot[]> {
    return await this.create(data);
  }

  async updateSlot(slotId: Types.ObjectId, data: Partial<ISlot>): Promise<ISlot | null> {
    return await this.update(slotId.toString(), data);
  }

  async deleteSlot(slotId: Types.ObjectId): Promise<void> {
    await this.delete(slotId.toString());
  }

  async getSlotById(slotId: Types.ObjectId): Promise<ISlot | null> {
    return await this.findById(slotId.toString());
  }

  async getSlotsByInstructor(instructorId: Types.ObjectId, date?: string): Promise<ISlot[]> {
    const query: FilterQuery<ISlot> = { instructorId };

    if (date) {
      const { startUTC, endUTC } = getISTDayRangeUTC(date);
      query.startTime = { $gte: startUTC, $lte: endUTC };
    }

    return await this.find(query, undefined, { startTime: 1 });
  }

  async checkOverlap(
    instructorId: Types.ObjectId,
    startTime: Date,
    endTime: Date,
    excludeSlotId?: Types.ObjectId,
  ): Promise<boolean> {
    const filter: FilterQuery<ISlot> = {
      instructorId,
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    };

    if (excludeSlotId) {
      filter._id = { $ne: excludeSlotId };
    }

    const overlappingSlot = await this.findOne(filter);
    return !!overlappingSlot;
  }

  // FULLY CORRECT & TYPE-SAFE
  async getSlotStats(
    instructorId: Types.ObjectId,
    mode: "monthly" | "yearly" | "custom",
    options: {
      month?: number;
      year?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ date: string; totalSlots: number; bookedSlots: number }[]> {
    let startDate: Date;
    let endDate: Date;

    if (mode === "monthly") {
      if (!options.month || !options.year) throw new Error("Month and Year required");
      const startIST = new Date(options.year, options.month - 1, 1, 0, 0, 0);
      const endIST = new Date(options.year, options.month, 1, 0, 0, 0);
      startDate = fromZonedTime(startIST, IST_TIMEZONE);
      endDate = fromZonedTime(endIST, IST_TIMEZONE);
    } else if (mode === "yearly") {
      if (!options.year) throw new Error("Year required");
      const startIST = new Date(options.year, 0, 1, 0, 0, 0);
      const endIST = new Date(options.year + 1, 0, 1, 0, 0, 0);
      startDate = fromZonedTime(startIST, IST_TIMEZONE);
      endDate = fromZonedTime(endIST, IST_TIMEZONE);
    } else if (mode === "custom") {
      if (!options.startDate || !options.endDate)
        throw new Error("startDate and endDate required for custom mode");
      startDate = options.startDate;
      endDate = options.endDate;
    } else {
      throw new Error("Invalid mode");
    }

    const result = await this.aggregate<{
      date: string;
      totalSlots: number;
      bookedSlots: number;
    }>([
      {
        $match: {
          instructorId,
          startTime: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$startTime", timezone: IST_TIMEZONE },
            },
          },
          totalSlots: { $sum: 1 },
          bookedSlots: {
            $sum: { $cond: [{ $eq: ["$isBooked", true] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          totalSlots: 1,
          bookedSlots: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    return result;
  }

  async deleteUnbookedSlotsForDate(instructorId: Types.ObjectId, date: string): Promise<void> {
    const { startUTC, endUTC } = getISTDayRangeUTC(date);

    await this.deleteMany({
      instructorId,
      startTime: { $gte: startUTC, $lte: endUTC },
      isBooked: false,
    });
  }
}