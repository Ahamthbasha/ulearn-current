import { IInstructorSlotService } from "./interface/IInstructorSlotService";
import { IInstructorSlotRepository } from "../../repositories/instructorRepository/interface/IInstructorSlotRepository";
import { ISlot } from "../../models/slotModel";
import { Types } from "mongoose";
import createHttpError from "http-errors";
import { SlotDTO } from "../../dto/instructorDTO/slotDTO";
import { mapSlotsToDTO } from "../../mappers/instructorMapper/slotMapper";

export class InstructorSlotService implements IInstructorSlotService {
  private _slotRepo: IInstructorSlotRepository;

  constructor(slotRepo: IInstructorSlotRepository) {
    this._slotRepo = slotRepo;
  }

  async createSlot(
    instructorId: Types.ObjectId,
    startTime: Date | { slots: { startTime: Date; endTime: Date; price: number }[]; repetitionMode: string },
    endTime?: Date,
    price?: number,
    repetitionMode?: string,
  ): Promise<ISlot | ISlot[]> {
    const now = new Date();

    if ('slots' in startTime) {
      // Handle bulk slot creation with repetition
      const { slots } = startTime;
      const createdSlots: ISlot[] = [];

      for (const slot of slots) {
        if (slot.startTime <= now) {
          throw createHttpError.BadRequest(`Cannot create a slot in the past for ${slot.startTime}`);
        }

        if (slot.endTime <= slot.startTime) {
          throw createHttpError.BadRequest(`End time must be after start time for ${slot.startTime}`);
        }

        const hasOverlap = await this._slotRepo.checkOverlap(
          instructorId,
          slot.startTime,
          slot.endTime,
        );
        if (!hasOverlap) {
          const newSlot = await this._slotRepo.createSlot({
            instructorId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            price: slot.price,
            isBooked: false,
          });
          createdSlots.push(newSlot);
        }
      }

      return createdSlots;
    } else {
      // Handle single or repeated slot creation
      if (!endTime || !price) {
        throw createHttpError.BadRequest("End time and price are required for single slot creation");
      }

      if (startTime <= now) {
        throw createHttpError.BadRequest("Cannot create a slot in the past");
      }

      if (endTime <= startTime) {
        throw createHttpError.BadRequest("End time must be after start time");
      }

      // Generate slots based on repetition mode
      const slotsToCreate: { startTime: Date; endTime: Date; price: number }[] = [];
      const daysToAdd = {
        week: 7,
        month: 30,
        year: 12,
      } as const;

      const effectiveRepetitionMode = repetitionMode || "single";

      if (["week", "month", "year"].includes(effectiveRepetitionMode)) {
        const maxIterations = daysToAdd[effectiveRepetitionMode as keyof typeof daysToAdd];
        for (let i = 0; i < maxIterations; i++) {
          const newStartTime = new Date(startTime);
          const newEndTime = new Date(endTime);
          if (effectiveRepetitionMode === "year") {
            newStartTime.setMonth(newStartTime.getMonth() + i);
            newEndTime.setMonth(newEndTime.getMonth() + i);
          } else {
            newStartTime.setDate(newStartTime.getDate() + i);
            newEndTime.setDate(newEndTime.getDate() + i);
          }

          if (newStartTime > now) {
            const hasOverlap = await this._slotRepo.checkOverlap(
              instructorId,
              newStartTime,
              newEndTime,
            );
            if (!hasOverlap) {
              slotsToCreate.push({ startTime: newStartTime, endTime: newEndTime, price });
            }
          }
        }

        const createdSlots = await this._slotRepo.createBulkSlots(
          slotsToCreate.map(slot => ({
            instructorId,
            ...slot,
            isBooked: false,
          }))
        );
        return createdSlots;
      } else {
        // Single slot creation
        const hasOverlap = await this._slotRepo.checkOverlap(
          instructorId,
          startTime,
          endTime,
        );
        if (hasOverlap) {
          throw createHttpError.Conflict("Slot overlaps with an existing one");
        }

        return await this._slotRepo.createSlot({
          instructorId,
          startTime,
          endTime,
          price,
          isBooked: false,
        });
      }
    }
  }

  async updateSlot(
    instructorId: Types.ObjectId,
    slotId: Types.ObjectId,
    data: Partial<ISlot>,
  ): Promise<ISlot> {
    const slot = await this._slotRepo.getSlotById(slotId);
    if (!slot) throw createHttpError.NotFound("Slot not found");
    if (!slot.instructorId.equals(instructorId))
      throw createHttpError.Forbidden("Access denied");

    const now = new Date();

    const newStartTime = data.startTime
      ? new Date(data.startTime)
      : slot.startTime;
    const newEndTime = data.endTime ? new Date(data.endTime) : slot.endTime;

    if (newStartTime <= now) {
      throw createHttpError.BadRequest("Cannot set slot in the past");
    }

    if (newEndTime <= newStartTime) {
      throw createHttpError.BadRequest("End time must be after start time");
    }

    const hasOverlap = await this._slotRepo.checkOverlap(
      instructorId,
      newStartTime,
      newEndTime,
      slot._id as Types.ObjectId,
    );
    if (
      hasOverlap &&
      (newStartTime.getTime() !== slot.startTime.getTime() ||
        newEndTime.getTime() !== slot.endTime.getTime())
    ) {
      throw createHttpError.Conflict(
        "Updated slot overlaps with an existing one",
      );
    }

    const updated = await this._slotRepo.updateSlot(slotId, {
      ...data,
      startTime: newStartTime,
      endTime: newEndTime,
    });

    if (!updated) throw createHttpError.InternalServerError("Update failed");
    return updated;
  }

  async deleteSlot(
    instructorId: Types.ObjectId,
    slotId: Types.ObjectId,
  ): Promise<void> {
    const slot = await this._slotRepo.getSlotById(slotId);
    if (!slot) throw createHttpError.NotFound("Slot not found");
    if (!slot.instructorId.equals(instructorId))
      throw createHttpError.Forbidden("Access denied");

    await this._slotRepo.deleteSlot(slotId);
  }

  async listSlots(instructorId: Types.ObjectId, date?: string): Promise<SlotDTO[]> {
    const slots = await this._slotRepo.getSlotsByInstructor(instructorId, date);
    return mapSlotsToDTO(slots);
  }

  async getSlotStats(
    instructorId: Types.ObjectId,
    mode: "monthly" | "yearly" | "custom",
    options: {
      month?: number;
      year?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    return await this._slotRepo.getSlotStats(instructorId, mode, options);
  }

  async deleteUnbookedSlotsForDate(
    instructorId: Types.ObjectId,
    date: string
  ): Promise<void> {
    const slots = await this._slotRepo.getSlotsByInstructor(instructorId, date);
    if (!slots || slots.length === 0) {
      throw createHttpError.NotFound("No slots found for the specified date");
    }

    for (const slot of slots) {
      if (!slot.instructorId.equals(instructorId)) {
        throw createHttpError.Forbidden("Access denied");
      }
    }

    await this._slotRepo.deleteUnbookedSlotsForDate(instructorId, date);
  }
}