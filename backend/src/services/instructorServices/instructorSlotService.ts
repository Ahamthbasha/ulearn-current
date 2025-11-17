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































































// import { IInstructorSlotService } from "./interface/IInstructorSlotService";
// import { IInstructorSlotRepository } from "../../repositories/instructorRepository/interface/IInstructorSlotRepository";
// import { ISlot } from "../../models/slotModel";
// import { Types } from "mongoose";
// import createHttpError from "http-errors";
// import { SlotDTO } from "../../dto/instructorDTO/slotDTO";
// import { mapSlotsToDTO } from "../../mappers/instructorMapper/slotMapper";
// import { addDays, differenceInDays, format } from "date-fns";
// import { fromZonedTime, toZonedTime } from "date-fns-tz";

// const IST_TIMEZONE = "Asia/Kolkata";

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
//     // Get current time in IST
//     const nowUTC = new Date();
//     const nowIST = toZonedTime(nowUTC, IST_TIMEZONE);
//     const todayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());

//     // Convert input times from IST to UTC for storage
//     const startTimeUTC = fromZonedTime(data.startTime, IST_TIMEZONE);
//     const endTimeUTC = fromZonedTime(data.endTime, IST_TIMEZONE);

//     if (endTimeUTC <= startTimeUTC) {
//       throw createHttpError.BadRequest("End time must be after start time");
//     }

//     if (data.recurrenceRule) {
//       const { daysOfWeek, startDate, endDate } = data.recurrenceRule;
//       const slotsToCreate: Partial<ISlot>[] = [];

//       // Validate start date (date only) in IST
//       let effectiveStartDate = new Date(startDate);
//       effectiveStartDate = new Date(
//         effectiveStartDate.getFullYear(),
//         effectiveStartDate.getMonth(),
//         effectiveStartDate.getDate(),
//       );
      
//       if (effectiveStartDate < todayIST) {
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
//           const timeDifference = endTimeUTC.getTime() - startTimeUTC.getTime();
          
//           // Create slot time in IST
//           const newStartTimeIST = new Date(currentDate);
//           newStartTimeIST.setHours(
//             data.startTime.getHours(),
//             data.startTime.getMinutes(),
//             0,
//             0,
//           );
          
//           // Convert to UTC for storage
//           const newStartTimeUTC = fromZonedTime(newStartTimeIST, IST_TIMEZONE);
//           const newEndTimeUTC = new Date(newStartTimeUTC.getTime() + timeDifference);

//           // Skip slots in the past (compare in UTC)
//           if (newStartTimeUTC >= nowUTC) {
//             const hasOverlap = await this._slotRepo.checkOverlap(
//               instructorId,
//               newStartTimeUTC,
//               newEndTimeUTC,
//             );
//             if (hasOverlap) {
//               throw createHttpError.Conflict(
//                 `Slot on ${format(newStartTimeIST, "yyyy-MM-dd")} overlaps with an existing one`,
//               );
//             }
//             slotsToCreate.push({
//               instructorId,
//               startTime: newStartTimeUTC,
//               endTime: newEndTimeUTC,
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
//       // Single slot creation
//       if (startTimeUTC <= nowUTC) {
//         throw createHttpError.BadRequest("Cannot create a slot in the past");
//       }

//       const hasOverlap = await this._slotRepo.checkOverlap(
//         instructorId,
//         startTimeUTC,
//         endTimeUTC,
//       );
//       if (hasOverlap) {
//         throw createHttpError.Conflict(
//           "There is already an existing slot created on that time",
//         );
//       }

//       return await this._slotRepo.createSlot({
//         instructorId,
//         startTime: startTimeUTC,
//         endTime: endTimeUTC,
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

//     const nowUTC = new Date();
    
//     // Convert input times from IST to UTC if provided
//     const newStartTimeUTC = data.startTime
//       ? fromZonedTime(new Date(data.startTime), IST_TIMEZONE)
//       : slot.startTime;
//     const newEndTimeUTC = data.endTime
//       ? fromZonedTime(new Date(data.endTime), IST_TIMEZONE)
//       : slot.endTime;

//     if (newStartTimeUTC <= nowUTC) {
//       throw createHttpError.BadRequest("Cannot set slot in the past");
//     }

//     if (newEndTimeUTC <= newStartTimeUTC) {
//       throw createHttpError.BadRequest("End time must be after start time");
//     }

//     const hasOverlap = await this._slotRepo.checkOverlap(
//       instructorId,
//       newStartTimeUTC,
//       newEndTimeUTC,
//       slot._id as Types.ObjectId,
//     );
//     if (
//       hasOverlap &&
//       (newStartTimeUTC.getTime() !== slot.startTime.getTime() ||
//         newEndTimeUTC.getTime() !== slot.endTime.getTime())
//     ) {
//       throw createHttpError.Conflict(
//         "Updated slot overlaps with an existing one",
//       );
//     }

//     const updated = await this._slotRepo.updateSlot(slotId, {
//       ...data,
//       startTime: newStartTimeUTC,
//       endTime: newEndTimeUTC,
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
import { toZonedTime } from "date-fns-tz";
import { appLogger } from "../../utils/logger";

const IST_TIMEZONE = "Asia/Kolkata";

export class InstructorSlotService implements IInstructorSlotService {
  private _slotRepo: IInstructorSlotRepository;

  constructor(slotRepo: IInstructorSlotRepository) {
    this._slotRepo = slotRepo;
  }

  async createSlot(
    instructorId: Types.ObjectId,
    data: {
      startTime: Date; // Already parsed by controller using parseISO
      endTime: Date;   // Already parsed by controller using parseISO
      price: number;
      recurrenceRule?: {
        daysOfWeek: number[];
        startDate: Date;  // Already parsed by controller
        endDate: Date;    // Already parsed by controller
      };
    },
  ): Promise<ISlot | ISlot[]> {
    appLogger.info("Creating slot", {
      instructorId: instructorId.toString(),
      startTime: data.startTime.toISOString(),
      endTime: data.endTime.toISOString(),
      hasRecurrence: !!data.recurrenceRule,
    });

    // Get current time in IST for validation
    const nowUTC = new Date();
    const nowIST = toZonedTime(nowUTC, IST_TIMEZONE);
    const todayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());

    // ✅ CORRECT: data.startTime and data.endTime are ALREADY Date objects in UTC
    // They were parsed by controller using parseISO() which respects timezone offsets
    const startTimeUTC = data.startTime;
    const endTimeUTC = data.endTime;

    appLogger.info("Slot times received (UTC)", {
      startTimeUTC: startTimeUTC.toISOString(),
      endTimeUTC: endTimeUTC.toISOString(),
      nowUTC: nowUTC.toISOString(),
    });

    if (endTimeUTC <= startTimeUTC) {
      appLogger.warn("End time validation failed", {
        startTimeUTC: startTimeUTC.toISOString(),
        endTimeUTC: endTimeUTC.toISOString(),
      });
      throw createHttpError.BadRequest("End time must be after start time");
    }

    if (data.recurrenceRule) {
      const { daysOfWeek, startDate, endDate } = data.recurrenceRule;
      const slotsToCreate: Partial<ISlot>[] = [];

      // ✅ CORRECT: startDate and endDate are already Date objects
      // Convert to IST for date-only comparison
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
      
      appLogger.info("Recurrence dates (IST)", {
        effectiveStartDate: format(effectiveStartDate, "yyyy-MM-dd"),
        todayIST: format(todayIST, "yyyy-MM-dd"),
      });

      if (effectiveStartDate < todayIST) {
        appLogger.warn("Recurrence start date is in the past", {
          effectiveStartDate: format(effectiveStartDate, "yyyy-MM-dd"),
          todayIST: format(todayIST, "yyyy-MM-dd"),
        });
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
        appLogger.warn("Invalid date range", {
          effectiveStartDate: format(effectiveStartDate, "yyyy-MM-dd"),
          effectiveEndDate: format(effectiveEndDate, "yyyy-MM-dd"),
        });
        throw createHttpError.BadRequest(
          "End date must be after or equal to start date",
        );
      }

      // Get the time components from the original UTC times by converting to IST
      const startTimeIST = toZonedTime(startTimeUTC, IST_TIMEZONE);
      const hours = startTimeIST.getHours();
      const minutes = startTimeIST.getMinutes();
      const timeDifference = endTimeUTC.getTime() - startTimeUTC.getTime();

      appLogger.info("Time components extracted", {
        hours,
        minutes,
        timeDifference: `${timeDifference / 60000} minutes`,
      });

      const duration = differenceInDays(effectiveEndDate, effectiveStartDate);
      
      for (let i = 0; i <= duration; i++) {
        const currentDate = addDays(effectiveStartDate, i);
        const dayOfWeek = currentDate.getDay();
        
        if (daysOfWeek.includes(dayOfWeek)) {
          // Create slot time in IST
          const newStartTimeIST = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            hours,
            minutes,
            0,
            0
          );
          
          // Convert IST to UTC manually (subtract 5:30)
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

          // Skip slots in the past (compare in UTC)
          if (newStartTimeUTC >= nowUTC) {
            const hasOverlap = await this._slotRepo.checkOverlap(
              instructorId,
              newStartTimeUTC,
              newEndTimeUTC,
            );
            if (hasOverlap) {
              appLogger.warn("Slot overlap detected", {
                date: format(newStartTimeIST, "yyyy-MM-dd"),
                startTime: format(newStartTimeIST, "HH:mm"),
              });
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
          } else {
            appLogger.info("Skipping past slot", {
              date: format(newStartTimeIST, "yyyy-MM-dd"),
              startTimeUTC: newStartTimeUTC.toISOString(),
              nowUTC: nowUTC.toISOString(),
            });
          }
        }
      }

      if (slotsToCreate.length === 0) {
        appLogger.warn("No valid slots to create", {
          requestedDays: daysOfWeek,
          dateRange: `${format(effectiveStartDate, "yyyy-MM-dd")} to ${format(effectiveEndDate, "yyyy-MM-dd")}`,
        });
        throw createHttpError.BadRequest(
          "No valid future slots could be created",
        );
      }

      appLogger.info("Creating bulk slots", {
        count: slotsToCreate.length,
        instructorId: instructorId.toString(),
      });

      const result = await this._slotRepo.createBulkSlots(slotsToCreate);
      
      appLogger.info("Bulk slots created successfully", {
        count: result.length,
      });

      return result;
    } else {
      // Single slot creation
      appLogger.info("Creating single slot", {
        startTimeUTC: startTimeUTC.toISOString(),
        endTimeUTC: endTimeUTC.toISOString(),
      });

      if (startTimeUTC <= nowUTC) {
        appLogger.warn("Attempted to create slot in the past", {
          startTimeUTC: startTimeUTC.toISOString(),
          nowUTC: nowUTC.toISOString(),
        });
        throw createHttpError.BadRequest("Cannot create a slot in the past");
      }

      const hasOverlap = await this._slotRepo.checkOverlap(
        instructorId,
        startTimeUTC,
        endTimeUTC,
      );
      if (hasOverlap) {
        appLogger.warn("Single slot overlap detected", {
          instructorId: instructorId.toString(),
          startTimeUTC: startTimeUTC.toISOString(),
        });
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

      appLogger.info("Single slot created successfully", {
        slotId: result._id.toString(),
        startTimeUTC: result.startTime.toISOString(),
        endTimeUTC: result.endTime.toISOString(),
      });

      return result;
    }
  }

  async updateSlot(
    instructorId: Types.ObjectId,
    slotId: Types.ObjectId,
    data: Partial<ISlot>,
  ): Promise<ISlot> {
    appLogger.info("Updating slot", {
      slotId: slotId.toString(),
      instructorId: instructorId.toString(),
      hasStartTime: !!data.startTime,
      hasEndTime: !!data.endTime,
    });

    const slot = await this._slotRepo.getSlotById(slotId);
    if (!slot) {
      appLogger.warn("Slot not found for update", {
        slotId: slotId.toString(),
      });
      throw createHttpError.NotFound("Slot not found");
    }
    
    if (!slot.instructorId.equals(instructorId)) {
      appLogger.warn("Unauthorized slot update attempt", {
        slotId: slotId.toString(),
        requestedBy: instructorId.toString(),
        ownedBy: slot.instructorId.toString(),
      });
      throw createHttpError.Forbidden("Access denied");
    }

    const nowUTC = new Date();
    
    // ✅ CORRECT: data.startTime and data.endTime are already Date objects from controller
    // They were parsed using parseISO() which respects timezone offsets
    const newStartTimeUTC = data.startTime || slot.startTime;
    const newEndTimeUTC = data.endTime || slot.endTime;

    appLogger.info("Update slot times", {
      newStartTimeUTC: newStartTimeUTC.toISOString(),
      newEndTimeUTC: newEndTimeUTC.toISOString(),
      originalStartTime: slot.startTime.toISOString(),
      originalEndTime: slot.endTime.toISOString(),
    });

    if (newStartTimeUTC <= nowUTC) {
      appLogger.warn("Attempted to update slot to past time", {
        newStartTimeUTC: newStartTimeUTC.toISOString(),
        nowUTC: nowUTC.toISOString(),
      });
      throw createHttpError.BadRequest("Cannot set slot in the past");
    }

    if (newEndTimeUTC <= newStartTimeUTC) {
      appLogger.warn("End time validation failed on update", {
        newStartTimeUTC: newStartTimeUTC.toISOString(),
        newEndTimeUTC: newEndTimeUTC.toISOString(),
      });
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
      appLogger.warn("Update would cause slot overlap", {
        slotId: slotId.toString(),
        newStartTimeUTC: newStartTimeUTC.toISOString(),
      });
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
      appLogger.error("Slot update failed", {
        slotId: slotId.toString(),
      });
      throw createHttpError.InternalServerError("Update failed");
    }

    appLogger.info("Slot updated successfully", {
      slotId: updated._id.toString(),
      startTimeUTC: updated.startTime.toISOString(),
      endTimeUTC: updated.endTime.toISOString(),
    });

    return updated;
  }

  async deleteSlot(
    instructorId: Types.ObjectId,
    slotId: Types.ObjectId,
  ): Promise<void> {
    appLogger.info("Deleting slot", {
      slotId: slotId.toString(),
      instructorId: instructorId.toString(),
    });

    const slot = await this._slotRepo.getSlotById(slotId);
    if (!slot) {
      appLogger.warn("Slot not found for deletion", {
        slotId: slotId.toString(),
      });
      throw createHttpError.NotFound("Slot not found");
    }
    
    if (!slot.instructorId.equals(instructorId)) {
      appLogger.warn("Unauthorized slot deletion attempt", {
        slotId: slotId.toString(),
        requestedBy: instructorId.toString(),
        ownedBy: slot.instructorId.toString(),
      });
      throw createHttpError.Forbidden("Access denied");
    }

    await this._slotRepo.deleteSlot(slotId);

    appLogger.info("Slot deleted successfully", {
      slotId: slotId.toString(),
    });
  }

  async listSlots(
    instructorId: Types.ObjectId,
    date?: string,
  ): Promise<SlotDTO[]> {
    appLogger.info("Listing slots", {
      instructorId: instructorId.toString(),
      date: date || "all",
    });

    const slots = await this._slotRepo.getSlotsByInstructor(instructorId, date);

    appLogger.info("Slots retrieved", {
      count: slots.length,
      instructorId: instructorId.toString(),
    });

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
    appLogger.info("Getting slot stats", {
      instructorId: instructorId.toString(),
      mode,
      options,
    });

    const stats = await this._slotRepo.getSlotStats(instructorId, mode, options);

    appLogger.info("Slot stats retrieved", {
      mode,
      recordCount: stats.length,
    });

    return stats;
  }

  async deleteUnbookedSlotsForDate(
    instructorId: Types.ObjectId,
    date: string,
  ): Promise<void> {
    appLogger.info("Deleting unbooked slots for date", {
      instructorId: instructorId.toString(),
      date,
    });

    const slots = await this._slotRepo.getSlotsByInstructor(instructorId, date);
    if (!slots || slots.length === 0) {
      appLogger.warn("No slots found for deletion", {
        instructorId: instructorId.toString(),
        date,
      });
      throw createHttpError.NotFound("No slots found for the specified date");
    }

    for (const slot of slots) {
      if (!slot.instructorId.equals(instructorId)) {
        appLogger.warn("Unauthorized bulk deletion attempt", {
          slotId: slot._id.toString(),
          requestedBy: instructorId.toString(),
          ownedBy: slot.instructorId.toString(),
        });
        throw createHttpError.Forbidden("Access denied");
      }
    }

    await this._slotRepo.deleteUnbookedSlotsForDate(instructorId, date);

    appLogger.info("Unbooked slots deleted successfully", {
      instructorId: instructorId.toString(),
      date,
    });
  }
}