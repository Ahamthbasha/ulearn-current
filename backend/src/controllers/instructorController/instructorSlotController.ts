// import { IInstructorSlotController } from "./interfaces/IInstructorSlotController";
// import { IInstructorSlotService } from "../../services/instructorServices/interface/IInstructorSlotService";
// import { Response } from "express";
// import mongoose from "mongoose";
// import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
// import { StatusCode } from "../../utils/enums";
// import { handleControllerError, BadRequestError } from "../../utils/errorHandlerUtil";
// import { appLogger } from "src/utils/logger";

// export class InstructorSlotController implements IInstructorSlotController {
//   private _slotService: IInstructorSlotService;

//   constructor(slotService: IInstructorSlotService) {
//     this._slotService = slotService;
//   }

//   async createSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
//     try {
//       if (!req.user?.id) {
//         throw new BadRequestError("Authentication required");
//       }

//       const instructorId = new mongoose.Types.ObjectId(req.user.id);
//       const { startTime, endTime, price, recurrenceRule } = req.body;

//       appLogger.info("slot creation",req.body)

//       if (!startTime || !endTime || price === undefined) {
//         throw new BadRequestError("startTime, endTime, and price are required");
//       }

//       const result = await this._slotService.createSlot(instructorId, {
//         startTime: new Date(startTime),
//         endTime: new Date(endTime),
//         price,
//         recurrenceRule: recurrenceRule
//           ? {
//               daysOfWeek: recurrenceRule.daysOfWeek,
//               startDate: new Date(recurrenceRule.startDate),
//               endDate: new Date(recurrenceRule.endDate),
//             }
//           : undefined,
//       });

//       res.status(StatusCode.CREATED).json({ success: true, slot: result });
//     } catch (error: unknown) {
//       handleControllerError(error, res);
//     }
//   }

//   async updateSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
//     try {
//       if (!req.user?.id) {
//         throw new BadRequestError("Authentication required");
//       }

//       const instructorId = new mongoose.Types.ObjectId(req.user.id);
//       const slotId = new mongoose.Types.ObjectId(req.params.slotId);

//       const updated = await this._slotService.updateSlot(
//         instructorId,
//         slotId,
//         req.body,
//       );

//       res.status(StatusCode.OK).json({ success: true, slot: updated });
//     } catch (error: unknown) {
//       handleControllerError(error, res);
//     }
//   }

//   async deleteSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
//     try {
//       if (!req.user?.id) {
//         throw new BadRequestError("Authentication required");
//       }

//       const instructorId = new mongoose.Types.ObjectId(req.user.id);
//       const slotId = new mongoose.Types.ObjectId(req.params.slotId);

//       await this._slotService.deleteSlot(instructorId, slotId);

//       res.status(StatusCode.NO_CONTENT).send();
//     } catch (error: unknown) {
//       handleControllerError(error, res);
//     }
//   }

//   async listSlots(req: AuthenticatedRequest, res: Response): Promise<void> {
//     try {
//       if (!req.user?.id) {
//         throw new BadRequestError("Authentication required");
//       }

//       const instructorId = new mongoose.Types.ObjectId(req.user.id);
//       const date = typeof req.query.date === "string" ? req.query.date : undefined;

//       const slots = await this._slotService.listSlots(instructorId, date);

//       res.status(StatusCode.OK).json({ success: true, slots });
//     } catch (error: unknown) {
//       handleControllerError(error, res);
//     }
//   }

//   async getSlotStatsByMonth(
//     req: AuthenticatedRequest,
//     res: Response,
//   ): Promise<void> {
//     try {
//       if (!req.user?.id) {
//         throw new BadRequestError("Authentication required");
//       }

//       const instructorId = new mongoose.Types.ObjectId(req.user.id);
//       const mode = req.query.mode as "monthly" | "yearly" | "custom";

//       if (!mode || !["monthly", "yearly", "custom"].includes(mode)) {
//         throw new BadRequestError("Invalid or missing mode");
//       }

//       const options: {
//         month?: number;
//         year?: number;
//         startDate?: Date;
//         endDate?: Date;
//       } = {};

//       if (mode === "monthly") {
//         const month = Number(req.query.month);
//         const year = Number(req.query.year);
//         if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
//           throw new BadRequestError("Valid month (1-12) and year are required");
//         }
//         options.month = month;
//         options.year = year;
//       } else if (mode === "yearly") {
//         const year = Number(req.query.year);
//         if (isNaN(year)) {
//           throw new BadRequestError("Valid year is required");
//         }
//         options.year = year;
//       } else if (mode === "custom") {
//         const startDateStr = req.query.startDate as string | undefined;
//         const endDateStr = req.query.endDate as string | undefined;

//         if (!startDateStr || !endDateStr) {
//           throw new BadRequestError("startDate and endDate are required for custom mode");
//         }

//         const startDate = new Date(startDateStr);
//         const endDate = new Date(endDateStr);

//         if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
//           throw new BadRequestError("Invalid date format");
//         }

//         if (startDate >= endDate) {
//           throw new BadRequestError("startDate must be before endDate");
//         }

//         options.startDate = startDate;
//         options.endDate = endDate;
//       }

//       const stats = await this._slotService.getSlotStats(
//         instructorId,
//         mode,
//         options,
//       );

//       res.status(StatusCode.OK).json({ success: true, data: stats });
//     } catch (error: unknown) {
//       handleControllerError(error, res);
//     }
//   }

//   async deleteUnbookedSlotsForDate(
//     req: AuthenticatedRequest,
//     res: Response,
//   ): Promise<void> {
//     try {
//       if (!req.user?.id) {
//         throw new BadRequestError("Authentication required");
//       }

//       const instructorId = new mongoose.Types.ObjectId(req.user.id);
//       const date = req.query.date as string | undefined;

//       if (!date) {
//         throw new BadRequestError("Date is required");
//       }

//       const dateObj = new Date(date);
//       if (isNaN(dateObj.getTime())) {
//         throw new BadRequestError("Invalid date format");
//       }

//       await this._slotService.deleteUnbookedSlotsForDate(instructorId, date);

//       res.status(StatusCode.NO_CONTENT).send();
//     } catch (error: unknown) {
//       handleControllerError(error, res);
//     }
//   }
// }












































import { IInstructorSlotController } from "./interfaces/IInstructorSlotController";
import { IInstructorSlotService } from "../../services/instructorServices/interface/IInstructorSlotService";
import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { handleControllerError, BadRequestError } from "../../utils/errorHandlerUtil";
import { parseISO } from "date-fns";
import { appLogger } from "../../utils/logger";

export class InstructorSlotController implements IInstructorSlotController {
  private _slotService: IInstructorSlotService;

  constructor(slotService: IInstructorSlotService) {
    this._slotService = slotService;
  }

  async createSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("Authentication required");
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const { startTime, endTime, price, recurrenceRule } = req.body;

      appLogger.info("CREATE SLOT REQUEST RECEIVED", {
        instructorId: instructorId.toString(),
        rawStartTime: startTime,
        rawEndTime: endTime,
        price,
        hasRecurrence: !!recurrenceRule,
      });

      if (!startTime || !endTime || price === undefined) {
        throw new BadRequestError("startTime, endTime, and price are required");
      }

      // ✅ CRITICAL FIX: Use parseISO to correctly parse ISO strings with timezone
      // parseISO respects the timezone offset in the ISO string (e.g., +05:30)
      // Unlike new Date(), which interprets based on server timezone
      const startTimeDate = parseISO(startTime);
      const endTimeDate = parseISO(endTime);

      appLogger.info("DATES PARSED WITH parseISO", {
        startTimeISO: startTimeDate.toISOString(),
        endTimeISO: endTimeDate.toISOString(),
        startTimeLocal: startTimeDate.toString(),
        endTimeLocal: endTimeDate.toString(),
      });

      // Validate parsed dates
      if (isNaN(startTimeDate.getTime()) || isNaN(endTimeDate.getTime())) {
        appLogger.error("DATE PARSING FAILED", {
          rawStartTime: startTime,
          rawEndTime: endTime,
        });
        throw new BadRequestError("Invalid date format. Use ISO 8601 format.");
      }

      const result = await this._slotService.createSlot(instructorId, {
        startTime: startTimeDate,
        endTime: endTimeDate,
        price,
        recurrenceRule: recurrenceRule
          ? {
              daysOfWeek: recurrenceRule.daysOfWeek,
              startDate: parseISO(recurrenceRule.startDate),
              endDate: parseISO(recurrenceRule.endDate),
            }
          : undefined,
      });

      appLogger.info("SLOT CREATION SUCCESSFUL", {
        instructorId: instructorId.toString(),
        slotCount: Array.isArray(result) ? result.length : 1,
      });

      res.status(StatusCode.CREATED).json({ success: true, slot: result });
    } catch (error: unknown) {
      appLogger.error("SLOT CREATION ERROR", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      handleControllerError(error, res);
    }
  }

  async updateSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("Authentication required");
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const slotId = new mongoose.Types.ObjectId(req.params.slotId);

      appLogger.info("UPDATE SLOT REQUEST RECEIVED", {
        instructorId: instructorId.toString(),
        slotId: slotId.toString(),
        updateFields: Object.keys(req.body),
      });

      // ✅ CRITICAL FIX: Parse dates correctly if they exist
      const updateData: any = { ...req.body };
      
      if (updateData.startTime) {
        appLogger.info("Parsing startTime for update", {
          raw: updateData.startTime,
        });
        updateData.startTime = parseISO(updateData.startTime);
        if (isNaN(updateData.startTime.getTime())) {
          throw new BadRequestError("Invalid startTime format");
        }
        appLogger.info("startTime parsed", {
          iso: updateData.startTime.toISOString(),
        });
      }
      
      if (updateData.endTime) {
        appLogger.info("Parsing endTime for update", {
          raw: updateData.endTime,
        });
        updateData.endTime = parseISO(updateData.endTime);
        if (isNaN(updateData.endTime.getTime())) {
          throw new BadRequestError("Invalid endTime format");
        }
        appLogger.info("endTime parsed", {
          iso: updateData.endTime.toISOString(),
        });
      }

      const updated = await this._slotService.updateSlot(
        instructorId,
        slotId,
        updateData,
      );

      appLogger.info("SLOT UPDATE SUCCESSFUL", {
        slotId: slotId.toString(),
      });

      res.status(StatusCode.OK).json({ success: true, slot: updated });
    } catch (error: unknown) {
      appLogger.error("SLOT UPDATE ERROR", {
        slotId: req.params.slotId,
        error: error instanceof Error ? error.message : String(error),
      });
      handleControllerError(error, res);
    }
  }

  async deleteSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("Authentication required");
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const slotId = new mongoose.Types.ObjectId(req.params.slotId);

      appLogger.info("DELETE SLOT REQUEST", {
        instructorId: instructorId.toString(),
        slotId: slotId.toString(),
      });

      await this._slotService.deleteSlot(instructorId, slotId);

      appLogger.info("SLOT DELETION SUCCESSFUL", {
        slotId: slotId.toString(),
      });

      res.status(StatusCode.NO_CONTENT).send();
    } catch (error: unknown) {
      appLogger.error("SLOT DELETION ERROR", {
        slotId: req.params.slotId,
        error: error instanceof Error ? error.message : String(error),
      });
      handleControllerError(error, res);
    }
  }

  async listSlots(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("Authentication required");
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const date = typeof req.query.date === "string" ? req.query.date : undefined;

      appLogger.info("LIST SLOTS REQUEST", {
        instructorId: instructorId.toString(),
        date: date || "all dates",
      });

      const slots = await this._slotService.listSlots(instructorId, date);

      appLogger.info("LIST SLOTS SUCCESSFUL", {
        instructorId: instructorId.toString(),
        count: slots.length,
      });

      res.status(StatusCode.OK).json({ success: true, slots });
    } catch (error: unknown) {
      appLogger.error("LIST SLOTS ERROR", {
        error: error instanceof Error ? error.message : String(error),
      });
      handleControllerError(error, res);
    }
  }

  async getSlotStatsByMonth(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("Authentication required");
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const mode = req.query.mode as "monthly" | "yearly" | "custom";

      appLogger.info("GET SLOT STATS REQUEST", {
        instructorId: instructorId.toString(),
        mode,
      });

      if (!mode || !["monthly", "yearly", "custom"].includes(mode)) {
        throw new BadRequestError("Invalid or missing mode");
      }

      const options: {
        month?: number;
        year?: number;
        startDate?: Date;
        endDate?: Date;
      } = {};

      if (mode === "monthly") {
        const month = Number(req.query.month);
        const year = Number(req.query.year);
        if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
          throw new BadRequestError("Valid month (1-12) and year are required");
        }
        options.month = month;
        options.year = year;
      } else if (mode === "yearly") {
        const year = Number(req.query.year);
        if (isNaN(year)) {
          throw new BadRequestError("Valid year is required");
        }
        options.year = year;
      } else if (mode === "custom") {
        const startDateStr = req.query.startDate as string | undefined;
        const endDateStr = req.query.endDate as string | undefined;

        if (!startDateStr || !endDateStr) {
          throw new BadRequestError("startDate and endDate are required for custom mode");
        }

        // ✅ CRITICAL FIX: Parse dates correctly
        const startDate = parseISO(startDateStr);
        const endDate = parseISO(endDateStr);

        appLogger.info("Custom date range parsed", {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new BadRequestError("Invalid date format");
        }

        if (startDate >= endDate) {
          throw new BadRequestError("startDate must be before endDate");
        }

        options.startDate = startDate;
        options.endDate = endDate;
      }

      const stats = await this._slotService.getSlotStats(
        instructorId,
        mode,
        options,
      );

      appLogger.info("SLOT STATS RETRIEVED", {
        mode,
        recordCount: stats.length,
      });

      res.status(StatusCode.OK).json({ success: true, data: stats });
    } catch (error: unknown) {
      appLogger.error("GET SLOT STATS ERROR", {
        error: error instanceof Error ? error.message : String(error),
      });
      handleControllerError(error, res);
    }
  }

  async deleteUnbookedSlotsForDate(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("Authentication required");
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const date = req.query.date as string | undefined;

      appLogger.info("DELETE UNBOOKED SLOTS REQUEST", {
        instructorId: instructorId.toString(),
        date,
      });

      if (!date) {
        throw new BadRequestError("Date is required");
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new BadRequestError("Invalid date format. Use YYYY-MM-DD");
      }

      await this._slotService.deleteUnbookedSlotsForDate(instructorId, date);

      appLogger.info("UNBOOKED SLOTS DELETED SUCCESSFULLY", {
        instructorId: instructorId.toString(),
        date,
      });

      res.status(StatusCode.NO_CONTENT).send();
    } catch (error: unknown) {
      appLogger.error("DELETE UNBOOKED SLOTS ERROR", {
        date: req.query.date,
        error: error instanceof Error ? error.message : String(error),
      });
      handleControllerError(error, res);
    }
  }
}