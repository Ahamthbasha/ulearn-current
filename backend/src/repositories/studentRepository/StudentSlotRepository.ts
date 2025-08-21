import { IStudentSlotRepository } from "./interface/IStudentSlotRepository";
import SlotModel, { ISlot } from "../../models/slotModel";
import { GenericRepository } from "../genericRepository";
import { PopulateOptions } from "mongoose";
export class StudentSlotRepository
  extends GenericRepository<ISlot>
  implements IStudentSlotRepository
{
  constructor() {
    super(SlotModel);
  }

  async getAvailableSlotsByInstructorId(
    instructorId: string,
  ): Promise<ISlot[]> {
    const now = new Date();

    console.log("Current time:", now.toISOString()); // For debugging

    return await this.find(
      {
        instructorId,
        isBooked: false,
        startTime: { $gt: now }, // Ensure slots are future
      },
      undefined,
      { startTime: 1 },
    );
  }

  async findById(slotId: string): Promise<ISlot | null> {
    return super.findById(slotId); // or use `this.findById` if exposed
  }

  async update(slotId: string, update: Partial<ISlot>): Promise<ISlot | null> {
    return super.update(slotId, update);
  }

  async findOne(
    filter: object,
    populate?: PopulateOptions[],
  ): Promise<ISlot | null> {
    return await super.findOne(filter, populate);
  }
}
