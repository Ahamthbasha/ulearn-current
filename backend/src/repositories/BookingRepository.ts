import { GenericRepository } from "./genericRepository";
import { BookingModel, IBooking } from "../models/bookingModel";

export class BookingRepository extends GenericRepository<IBooking> {
  constructor() {
    super(BookingModel);
  }
}
