import { Types } from "mongoose";
import { BookingModel, IBooking } from "../../models/bookingModel";
import { GenericRepository } from "../genericRepository";
import {
  IAdminBookingRepository,
  IBlockingResult,
} from "./interface/IAdminBookingRepository";
import { IAdminUserRepository } from "./interface/IAdminUserRepository";
import { isSlot } from "../../models/slotModel";

export class AdminBookingRepository
  extends GenericRepository<IBooking>
  implements IAdminBookingRepository
{
  private _adminUserRepository: IAdminUserRepository;

  constructor(adminUserRepository: IAdminUserRepository) {
    super(BookingModel);
    this._adminUserRepository = adminUserRepository;
  }
  async getUserIdByEmail(email: string): Promise<string | null> {
    try {
      const user = await this._adminUserRepository.getUserData(email);
      return user ? user._id.toString() : null;
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(`Error finding user by email: ${errorMessage}`);
    }
  }

  async checkUserBlockingStatus(email: string): Promise<IBlockingResult> {
    try {
      // First, check if user exists using AdminUserRepository
      const user = await this._adminUserRepository.getUserData(email);

      if (!user) {
        return {
          canBlockNow: false,
          hasActiveSession: false,
          message: `User with email ${email} not found.`,
        };
      }

      if (user.isBlocked) {
        return {
          canBlockNow: false,
          hasActiveSession: false,
          message: `User with email ${email} is already blocked.`,
        };
      }

      // Find current active session (happening RIGHT NOW)
      const activeSession = await this.getCurrentActiveSession(email);

      if (!activeSession) {
        return {
          canBlockNow: true,
          hasActiveSession: false,
          message: "User has no active session. Can be blocked immediately.",
        };
      }

      const slot = activeSession.slotId;

      if(!isSlot(slot)){
        throw new Error("slot is not populated")
      }
      
      const sessionEndTime = slot.endTime;

      return {
        canBlockNow: false,
        hasActiveSession: true,
        sessionEndTime,
        message: `User is currently in a video call (${slot.startTime.toLocaleTimeString()} - ${sessionEndTime.toLocaleTimeString()}). Will be blocked after session ends.`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(`Error checking user blocking status: ${errorMessage}`);
    }
  }

  async getCurrentActiveSession(email: string): Promise<IBooking | null> {
    try {
      // Get userId using AdminUserRepository
      const userId = await this.getUserIdByEmail(email);

      if (!userId) {
        return null;
      }

      const currentTime = new Date();

      const activeBookings = await this.findAll(
        {
          studentId: new Types.ObjectId(userId),
          status: { $in: ["confirmed", "pending"] },
          paymentStatus: "paid",
        },
        [
          {
            path: "slotId",
            match: {
              startTime: { $lte: currentTime }, // Session has started
              endTime: { $gte: currentTime }, // Session hasn't ended yet
            },
          },
          {
            path: "instructorId",
            select: "name email",
          },
        ],
      );

      // Filter out bookings where slotId is null (didn't match populate criteria)
      const ongoingSessions = activeBookings.filter(
        (booking) => booking.slotId !== null,
      );

      // Return first active session (there should typically be only one)
      return ongoingSessions.length > 0 ? ongoingSessions[0] : null;
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(
        `Error fetching current active session: ${errorMessage}`,
      );
    }
  }
}
