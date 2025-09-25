import { ISlot } from "../models/slotModel";

export interface SlotAvailabilityResult {
  available: boolean;
  reason?:
    | "SLOT_ALREADY_BOOKED"
    | "PENDING_BOOKING_EXISTS"
    | "PENDING_BOOKING_BY_OTHERS"
    | "SLOT_NOT_FOUND";
  message?: string;
  bookingId?: string;
  createdAt?: Date;
  slot?: ISlot;
}
