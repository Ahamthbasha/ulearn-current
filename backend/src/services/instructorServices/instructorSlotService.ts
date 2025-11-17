// import { IInstructorSlotService } from "./interface/IInstructorSlotService";
// import { IInstructorSlotRepository } from "../../repositories/instructorRepository/interface/IInstructorSlotRepository";
// import { ISlot } from "../../models/slotModel";
// import { Types } from "mongoose";
// import createHttpError from "http-errors";
// import { SlotDTO } from "../../dto/instructorDTO/slotDTO";
// import { mapSlotsToDTO } from "../../mappers/instructorMapper/slotMapper";
// import { addDays, differenceInDays, format } from "date-fns";

// export class InstructorSlotService implements IInstructorSlotService {
//   private _slotRepo: IInstructorSlotRepository;

//   constructor(slotRepo: IInstructorSlotRepository) {
//     this._slotRepo = slotRepo;
//   }

//   async createSlot(
//     instructorId: Types.ObjectId,
//     data: {
//       startTime: Date;
//       endTime: Date;
//       price: number;
//       recurrenceRule?: {
//         daysOfWeek: number[];
//         startDate: Date;
//         endDate: Date;
//       };
//     },
//   ): Promise<ISlot | ISlot[]> {
//     const now = new Date();
//     const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

//     if (data.endTime <= data.startTime) {
//       throw createHttpError.BadRequest("End time must be after start time");
//     }

//     if (data.recurrenceRule) {
//       const { daysOfWeek, startDate, endDate } = data.recurrenceRule;
//       const slotsToCreate: Partial<ISlot>[] = [];

//       // Validate start date (date only)
//       let effectiveStartDate = new Date(startDate);
//       effectiveStartDate = new Date(
//         effectiveStartDate.getFullYear(),
//         effectiveStartDate.getMonth(),
//         effectiveStartDate.getDate(),
//       );
//       if (effectiveStartDate < today) {
//         throw createHttpError.BadRequest(
//           "Recurrence start date must be today or in the future",
//         );
//       }

//       if (effectiveStartDate > endDate) {
//         throw createHttpError.BadRequest(
//           "End date must be after or equal to start date",
//         );
//       }

//       const duration = differenceInDays(endDate, effectiveStartDate);
//       for (let i = 0; i <= duration; i++) {
//         const currentDate = addDays(effectiveStartDate, i);
//         const dayOfWeek = currentDate.getDay();
//         if (daysOfWeek.includes(dayOfWeek)) {
//           const timeDifference =
//             data.endTime.getTime() - data.startTime.getTime();
//           const newStartTime = new Date(currentDate);
//           newStartTime.setHours(
//             data.startTime.getHours(),
//             data.startTime.getMinutes(),
//             0,
//             0,
//           );
//           const newEndTime = new Date(newStartTime.getTime() + timeDifference);

//           // Skip slots in the past
//           if (newStartTime >= now) {
//             const hasOverlap = await this._slotRepo.checkOverlap(
//               instructorId,
//               newStartTime,
//               newEndTime,
//             );
//             if (hasOverlap) {
//               throw createHttpError.Conflict(
//                 `Slot on ${format(newStartTime, "yyyy-MM-dd")} overlaps with an existing one`,
//               );
//             }
//             slotsToCreate.push({
//               instructorId,
//               startTime: newStartTime,
//               endTime: newEndTime,
//               price: data.price,
//               isBooked: false,
//               recurrenceRule: {
//                 daysOfWeek,
//                 startDate: effectiveStartDate,
//                 endDate,
//               },
//             });
//           }
//         }
//       }

//       if (slotsToCreate.length === 0) {
//         throw createHttpError.BadRequest(
//           "No valid future slots could be created",
//         );
//       }

//       return await this._slotRepo.createBulkSlots(slotsToCreate);
//     } else {
//       if (data.startTime <= now) {
//         throw createHttpError.BadRequest("Cannot create a slot in the past");
//       }

//       const hasOverlap = await this._slotRepo.checkOverlap(
//         instructorId,
//         data.startTime,
//         data.endTime,
//       );
//       if (hasOverlap) {
//         throw createHttpError.Conflict(
//           "There is already an existing slot created on that time",
//         );
//       }

//       return await this._slotRepo.createSlot({
//         instructorId,
//         startTime: data.startTime,
//         endTime: data.endTime,
//         price: data.price,
//         isBooked: false,
//       });
//     }
//   }

//   async updateSlot(
//     instructorId: Types.ObjectId,
//     slotId: Types.ObjectId,
//     data: Partial<ISlot>,
//   ): Promise<ISlot> {
//     const slot = await this._slotRepo.getSlotById(slotId);
//     if (!slot) throw createHttpError.NotFound("Slot not found");
//     if (!slot.instructorId.equals(instructorId))
//       throw createHttpError.Forbidden("Access denied");

//     const now = new Date();
//     const newStartTime = data.startTime
//       ? new Date(data.startTime)
//       : slot.startTime;
//     const newEndTime = data.endTime ? new Date(data.endTime) : slot.endTime;

//     if (newStartTime <= now) {
//       throw createHttpError.BadRequest("Cannot set slot in the past");
//     }

//     if (newEndTime <= newStartTime) {
//       throw createHttpError.BadRequest("End time must be after start time");
//     }

//     const hasOverlap = await this._slotRepo.checkOverlap(
//       instructorId,
//       newStartTime,
//       newEndTime,
//       slot._id as Types.ObjectId,
//     );
//     if (
//       hasOverlap &&
//       (newStartTime.getTime() !== slot.startTime.getTime() ||
//         newEndTime.getTime() !== slot.endTime.getTime())
//     ) {
//       throw createHttpError.Conflict(
//         "Updated slot overlaps with an existing one",
//       );
//     }

//     const updated = await this._slotRepo.updateSlot(slotId, {
//       ...data,
//       startTime: newStartTime,
//       endTime: newEndTime,
//     });

//     if (!updated) throw createHttpError.InternalServerError("Update failed");
//     return updated;
//   }

//   async deleteSlot(
//     instructorId: Types.ObjectId,
//     slotId: Types.ObjectId,
//   ): Promise<void> {
//     const slot = await this._slotRepo.getSlotById(slotId);
//     if (!slot) throw createHttpError.NotFound("Slot not found");
//     if (!slot.instructorId.equals(instructorId))
//       throw createHttpError.Forbidden("Access denied");

//     await this._slotRepo.deleteSlot(slotId);
//   }

//   async listSlots(
//     instructorId: Types.ObjectId,
//     date?: string,
//   ): Promise<SlotDTO[]> {
//     const slots = await this._slotRepo.getSlotsByInstructor(instructorId, date);
//     return mapSlotsToDTO(slots);
//   }

//   async getSlotStats(
//     instructorId: Types.ObjectId,
//     mode: "monthly" | "yearly" | "custom",
//     options: {
//       month?: number;
//       year?: number;
//       startDate?: Date;
//       endDate?: Date;
//     },
//   ) {
//     return await this._slotRepo.getSlotStats(instructorId, mode, options);
//   }

//   async deleteUnbookedSlotsForDate(
//     instructorId: Types.ObjectId,
//     date: string,
//   ): Promise<void> {
//     const slots = await this._slotRepo.getSlotsByInstructor(instructorId, date);
//     if (!slots || slots.length === 0) {
//       throw createHttpError.NotFound("No slots found for the specified date");
//     }

//     for (const slot of slots) {
//       if (!slot.instructorId.equals(instructorId)) {
//         throw createHttpError.Forbidden("Access denied");
//       }
//     }

//     await this._slotRepo.deleteUnbookedSlotsForDate(instructorId, date);
//   }
// }































































import { IInstructorSlotService } from "./interface/IInstructorSlotService";
import { IInstructorSlotRepository } from "../../repositories/instructorRepository/interface/IInstructorSlotRepository";
import { ISlot } from "../../models/slotModel";
import { Types } from "mongoose";
import createHttpError from "http-errors";
import { SlotDTO } from "../../dto/instructorDTO/slotDTO";
import { mapSlotsToDTO } from "../../mappers/instructorMapper/slotMapper";
import { addDays, differenceInDays, format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

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
    // Get current time in IST
    const nowUTC = new Date();
    const nowIST = toZonedTime(nowUTC, IST_TIMEZONE);
    const todayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());

    // Convert input times from IST to UTC for storage
    const startTimeUTC = fromZonedTime(data.startTime, IST_TIMEZONE);
    const endTimeUTC = fromZonedTime(data.endTime, IST_TIMEZONE);

    if (endTimeUTC <= startTimeUTC) {
      throw createHttpError.BadRequest("End time must be after start time");
    }

    if (data.recurrenceRule) {
      const { daysOfWeek, startDate, endDate } = data.recurrenceRule;
      const slotsToCreate: Partial<ISlot>[] = [];

      // Validate start date (date only) in IST
      let effectiveStartDate = new Date(startDate);
      effectiveStartDate = new Date(
        effectiveStartDate.getFullYear(),
        effectiveStartDate.getMonth(),
        effectiveStartDate.getDate(),
      );
      
      if (effectiveStartDate < todayIST) {
        throw createHttpError.BadRequest(
          "Recurrence start date must be today or in the future",
        );
      }

      if (effectiveStartDate > endDate) {
        throw createHttpError.BadRequest(
          "End date must be after or equal to start date",
        );
      }

      const duration = differenceInDays(endDate, effectiveStartDate);
      for (let i = 0; i <= duration; i++) {
        const currentDate = addDays(effectiveStartDate, i);
        const dayOfWeek = currentDate.getDay();
        
        if (daysOfWeek.includes(dayOfWeek)) {
          const timeDifference = endTimeUTC.getTime() - startTimeUTC.getTime();
          
          // Create slot time in IST
          const newStartTimeIST = new Date(currentDate);
          newStartTimeIST.setHours(
            data.startTime.getHours(),
            data.startTime.getMinutes(),
            0,
            0,
          );
          
          // Convert to UTC for storage
          const newStartTimeUTC = fromZonedTime(newStartTimeIST, IST_TIMEZONE);
          const newEndTimeUTC = new Date(newStartTimeUTC.getTime() + timeDifference);

          // Skip slots in the past (compare in UTC)
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
                startDate: effectiveStartDate,
                endDate,
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

      return await this._slotRepo.createBulkSlots(slotsToCreate);
    } else {
      // Single slot creation
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

      return await this._slotRepo.createSlot({
        instructorId,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        price: data.price,
        isBooked: false,
      });
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

    const nowUTC = new Date();
    
    // Convert input times from IST to UTC if provided
    const newStartTimeUTC = data.startTime
      ? fromZonedTime(new Date(data.startTime), IST_TIMEZONE)
      : slot.startTime;
    const newEndTimeUTC = data.endTime
      ? fromZonedTime(new Date(data.endTime), IST_TIMEZONE)
      : slot.endTime;

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
    return await this._slotRepo.getSlotStats(instructorId, mode, options);
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