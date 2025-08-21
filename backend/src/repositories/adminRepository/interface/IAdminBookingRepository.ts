import { IBooking } from "../../../models/bookingModel";
import { IGenericRepository } from "../../../repositories/genericRepository"; 

export interface IBlockingResult {
  canBlockNow: boolean;
  hasActiveSession: boolean;
  sessionEndTime?: Date;
  message: string;
}

export interface IAdminBookingRepository extends IGenericRepository<IBooking> {
  checkUserBlockingStatus(email: string): Promise<IBlockingResult>;
  getUserIdByEmail(email: string): Promise<string | null>
  getCurrentActiveSession(email: string): Promise<IBooking | null>;
}