import { IInstructorSlotRepository } from "../interfaces/IInstructorSlotRepository";
import SlotModel, { ISlot } from "../../models/slotModel";
import { Types } from "mongoose";
import { GenericRepository } from "../genericRepository";

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

  async updateSlot(slotId: Types.ObjectId, data: Partial<ISlot>): Promise<ISlot | null> {
    return await this.update(slotId.toString(), data); // use generic update by ID
  }

  async deleteSlot(slotId: Types.ObjectId): Promise<void> {
    await this.delete(slotId.toString()); // use generic delete
  }

  async getSlotById(slotId: Types.ObjectId): Promise<ISlot | null> {
    return await this.findById(slotId.toString()); // use generic findById
  }

  async getSlotsByInstructor(instructorId: Types.ObjectId): Promise<ISlot[]> {
    return await this.find({ instructorId }, undefined, { startTime: 1 }); // use generic find
  }

  async checkOverlap(
  instructorId: Types.ObjectId,
  startTime: Date,
  endTime: Date,
  excludeSlotId?: Types.ObjectId // optional
): Promise<boolean> {
  const filter: any = {
    instructorId,
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      },
    ],
  };

  if (excludeSlotId) {
    filter._id = { $ne: excludeSlotId }; // exclude the current slot
  }

  const overlappingSlot = await this.findOne(filter);
  return !!overlappingSlot;
}


  async getSlotStats(
  instructorId: Types.ObjectId,
  mode: "monthly" | "yearly" | "custom",
  options: {
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
  }
) {
  let startDate: Date;
  let endDate: Date;

  if (mode === "monthly") {
    if (!options.month || !options.year) throw new Error("Month and Year are required for monthly mode");
    startDate = new Date(options.year, options.month - 1, 1);
    endDate = new Date(options.year, options.month, 1);
  } else if (mode === "yearly") {
    if (!options.year) throw new Error("Year is required for yearly mode");
    startDate = new Date(options.year, 0, 1);
    endDate = new Date(options.year + 1, 0, 1);
  } else if (mode === "custom") {
    if (!options.startDate || !options.endDate) throw new Error("Start and end date are required for custom mode");
    startDate = options.startDate;
    endDate = options.endDate;
  } else {
    throw new Error("Invalid mode");
  }

  const result = await this.aggregate([
    {
      $match: {
        instructorId,
        startTime: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
        },
        totalSlots: { $sum: 1 },
        bookedSlots: {
          $sum: {
            $cond: [{ $eq: ["$isBooked", true] }, 1, 0],
          },
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

}
