import { IInstructorSlotService } from "../interface/IInstructorSlotService";
import { IInstructorSlotRepository } from "../../repositories/interfaces/IInstructorSlotRepository";
import { ISlot } from "../../models/slotModel";
import { Types } from "mongoose";
import createHttpError from "http-errors";

export class InstructorSlotService implements IInstructorSlotService {
  constructor(private slotRepo: IInstructorSlotRepository) {}

  async createSlot(
    instructorId: Types.ObjectId,
    startTime: Date,
    endTime: Date,
    price: number
  ): Promise<ISlot> {
    const now = new Date();

    if (startTime <= now) {
      throw createHttpError.BadRequest("Cannot create a slot in the past");
    }

    if (endTime <= startTime) {
      throw createHttpError.BadRequest("End time must be after start time");
    }

    const hasOverlap = await this.slotRepo.checkOverlap(instructorId, startTime, endTime);
    if (hasOverlap) {
      throw createHttpError.Conflict("Slot overlaps with an existing one");
    }

    return await this.slotRepo.createSlot({
      instructorId,
      startTime,
      endTime,
      price,
      isBooked: false,
    });
  }

  async updateSlot(
    instructorId: Types.ObjectId,
    slotId: Types.ObjectId,
    data: Partial<ISlot>
  ): Promise<ISlot> {
    const slot = await this.slotRepo.getSlotById(slotId);
    if (!slot) throw createHttpError.NotFound("Slot not found");
    if (!slot.instructorId.equals(instructorId)) throw createHttpError.Forbidden("Access denied");

    const now = new Date();

    const newStartTime = data.startTime ? new Date(data.startTime) : slot.startTime;
    const newEndTime = data.endTime ? new Date(data.endTime) : slot.endTime;

    if (newStartTime <= now) {
      throw createHttpError.BadRequest("Cannot set slot in the past");
    }

    if (newEndTime <= newStartTime) {
      throw createHttpError.BadRequest("End time must be after start time");
    }

    const hasOverlap = await this.slotRepo.checkOverlap(instructorId, newStartTime, newEndTime,slot._id as Types.ObjectId);
    if (hasOverlap && (newStartTime.getTime() !== slot.startTime.getTime() || newEndTime.getTime() !== slot.endTime.getTime())) {
      throw createHttpError.Conflict("Updated slot overlaps with an existing one");
    }

    const updated = await this.slotRepo.updateSlot(slotId, {
      ...data,
      startTime: newStartTime,
      endTime: newEndTime,
    });

    if (!updated) throw createHttpError.InternalServerError("Update failed");
    return updated;
  }

  async deleteSlot(instructorId: Types.ObjectId, slotId: Types.ObjectId): Promise<void> {
    const slot = await this.slotRepo.getSlotById(slotId);
    if (!slot) throw createHttpError.NotFound("Slot not found");
    if (!slot.instructorId.equals(instructorId)) throw createHttpError.Forbidden("Access denied");

    await this.slotRepo.deleteSlot(slotId);
  }

  async listSlots(instructorId: Types.ObjectId): Promise<ISlot[]> {
    return await this.slotRepo.getSlotsByInstructor(instructorId);
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
  return await this.slotRepo.getSlotStats(instructorId, mode, options);
}


}
