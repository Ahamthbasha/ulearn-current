import { IInstructorSlotService } from "./interface/IInstructorSlotService";
import { IInstructorSlotRepository } from "../../repositories/instructorRepository/interface/IInstructorSlotRepository";
import { ISlot } from "../../models/slotModel";
import { Types } from "mongoose";
import createHttpError from "http-errors";
import { SlotDTO } from "../../dto/instructorDTO/slotDTO";
import { mapSlotsToDTO } from "../../mappers/instructorMapper/slotMapper";
import { addDays, differenceInDays, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const IST_TIMEZONE = "Asia/Kolkata";

export class InstructorSlotService implements IInstructorSlotService {
  private _slotRepo: IInstructorSlotRepository;

  constructor(slotRepo: IInstructorSlotRepository) {
    this._slotRepo = slotRepo;
  }

  async createSlot(
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
  ): Promise<ISlot | ISlot[]> {
    const nowUTC = new Date();
    const nowIST = toZonedTime(nowUTC, IST_TIMEZONE);
    const todayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());

    const startTimeUTC = data.startTime;
    const endTimeUTC = data.endTime;

    if (endTimeUTC <= startTimeUTC) {
      throw createHttpError.BadRequest("End time must be after start time");
    }

    if (data.recurrenceRule) {
      const { daysOfWeek, startDate, endDate } = data.recurrenceRule;
      const slotsToCreate: Partial<ISlot>[] = [];
      const startDateIST = toZonedTime(startDate, IST_TIMEZONE);
      let effectiveStartDate = new Date(
        startDateIST.getFullYear(),
        startDateIST.getMonth(),
        startDateIST.getDate(),
        0,
        0,
        0,
        0
      );

      if (effectiveStartDate < todayIST) {
        throw createHttpError.BadRequest(
          "Recurrence start date must be today or in the future",
        );
      }

      const endDateIST = toZonedTime(endDate, IST_TIMEZONE);
      const effectiveEndDate = new Date(
        endDateIST.getFullYear(),
        endDateIST.getMonth(),
        endDateIST.getDate(),
        23,
        59,
        59,
        999
      );

      if (effectiveStartDate > effectiveEndDate) {
        throw createHttpError.BadRequest(
          "End date must be after or equal to start date",
        );
      }
      const startTimeIST = toZonedTime(startTimeUTC, IST_TIMEZONE);
      const hours = startTimeIST.getHours();
      const minutes = startTimeIST.getMinutes();
      const timeDifference = endTimeUTC.getTime() - startTimeUTC.getTime();

      const duration = differenceInDays(effectiveEndDate, effectiveStartDate);

      for (let i = 0; i <= duration; i++) {
        const currentDate = addDays(effectiveStartDate, i);
        const dayOfWeek = currentDate.getDay();

        if (daysOfWeek.includes(dayOfWeek)) {
          const newStartTimeIST = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            hours,
            minutes,
            0,
            0
          );

          const newStartTimeUTC = new Date(
            Date.UTC(
              newStartTimeIST.getFullYear(),
              newStartTimeIST.getMonth(),
              newStartTimeIST.getDate(),
              hours - 5,
              minutes - 30,
              0,
              0
            )
          );
          const newEndTimeUTC = new Date(newStartTimeUTC.getTime() + timeDifference);

          if (newStartTimeUTC >= nowUTC) {
            const hasOverlap = await this._slotRepo.checkOverlap(
              instructorId,
              newStartTimeUTC,
              newEndTimeUTC,
            );
            if (hasOverlap) {
              throw createHttpError.Conflict(
                `Slot on ${format(newStartTimeIST, "yyyy-MM-dd")} overlaps with an existing one`,
              );
            }
            slotsToCreate.push({
              instructorId,
              startTime: newStartTimeUTC,
              endTime: newEndTimeUTC,
              price: data.price,
              isBooked: false,
              recurrenceRule: {
                daysOfWeek,
                startDate: startDate,
                endDate: endDate,
              },
            });
          }
        }
      }

      if (slotsToCreate.length === 0) {
        throw createHttpError.BadRequest(
          "No valid future slots could be created",
        );
      }

      const result = await this._slotRepo.createBulkSlots(slotsToCreate);
      return result;
    } else {
      if (startTimeUTC <= nowUTC) {
        throw createHttpError.BadRequest("Cannot create a slot in the past");
      }

      const hasOverlap = await this._slotRepo.checkOverlap(
        instructorId,
        startTimeUTC,
        endTimeUTC,
      );
      if (hasOverlap) {
        throw createHttpError.Conflict(
          "There is already an existing slot created on that time",
        );
      }

      const result = await this._slotRepo.createSlot({
        instructorId,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        price: data.price,
        isBooked: false,
      });

      return result;
    }
  }

  async updateSlot(
    instructorId: Types.ObjectId,
    slotId: Types.ObjectId,
    data: Partial<ISlot>,
  ): Promise<ISlot> {
    const slot = await this._slotRepo.getSlotById(slotId);
    if (!slot) {
      throw createHttpError.NotFound("Slot not found");
    }

    if (!slot.instructorId.equals(instructorId)) {
      throw createHttpError.Forbidden("Access denied");
    }

    const nowUTC = new Date();
    const newStartTimeUTC = data.startTime || slot.startTime;
    const newEndTimeUTC = data.endTime || slot.endTime;

    if (newStartTimeUTC <= nowUTC) {
      throw createHttpError.BadRequest("Cannot set slot in the past");
    }

    if (newEndTimeUTC <= newStartTimeUTC) {
      throw createHttpError.BadRequest("End time must be after start time");
    }

    const hasOverlap = await this._slotRepo.checkOverlap(
      instructorId,
      newStartTimeUTC,
      newEndTimeUTC,
      slot._id as Types.ObjectId,
    );

    if (
      hasOverlap &&
      (newStartTimeUTC.getTime() !== slot.startTime.getTime() ||
        newEndTimeUTC.getTime() !== slot.endTime.getTime())
    ) {
      throw createHttpError.Conflict(
        "Updated slot overlaps with an existing one",
      );
    }

    const updated = await this._slotRepo.updateSlot(slotId, {
      ...data,
      startTime: newStartTimeUTC,
      endTime: newEndTimeUTC,
    });

    if (!updated) {
      throw createHttpError.InternalServerError("Update failed");
    }

    return updated;
  }

  async deleteSlot(
    instructorId: Types.ObjectId,
    slotId: Types.ObjectId,
  ): Promise<void> {
    const slot = await this._slotRepo.getSlotById(slotId);
    if (!slot) {
      throw createHttpError.NotFound("Slot not found");
    }

    if (!slot.instructorId.equals(instructorId)) {
      throw createHttpError.Forbidden("Access denied");
    }

    await this._slotRepo.deleteSlot(slotId);
  }

  async listSlots(
    instructorId: Types.ObjectId,
    date?: string,
  ): Promise<SlotDTO[]> {
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
    const stats = await this._slotRepo.getSlotStats(instructorId, mode, options);
    return stats;
  }

  async deleteUnbookedSlotsForDate(
    instructorId: Types.ObjectId,
    date: string,
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