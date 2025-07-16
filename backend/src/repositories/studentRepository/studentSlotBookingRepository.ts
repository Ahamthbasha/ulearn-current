import { IStudentSlotBookingRepository } from "../interfaces/IStudentSlotBookingRepository";
import { BookingModel, IBooking } from "../../models/bookingModel";
import { GenericRepository } from "../genericRepository";
import { PopulateOptions, Types } from "mongoose";

export class StudentSlotBookingRepository
  extends GenericRepository<IBooking>
  implements IStudentSlotBookingRepository
{
  constructor() {
    super(BookingModel);
  }

  async createBooking(booking: Partial<IBooking>): Promise<IBooking> {
    const created = await this.create(booking);
    return created as IBooking;
  }

  async updateBookingStatus(
    id: string,
    update: Partial<IBooking>
  ): Promise<void> {
    await this.update(id, update);
  }

  async findBookingById(
    id: string,
    populate: PopulateOptions[] = []
  ): Promise<IBooking | null> {
    if (populate.length) {
      return await this.findByIdWithPopulate(id, populate);
    }
    return await this.findById(id);
  }

  async findOne(
    filter: object,
    populate?: PopulateOptions[]
  ): Promise<IBooking | null> {
    return await super.findOne(filter, populate);
  }

  async findAllBookingsByStudentPaginated(
    studentId: string,
    page: number,
    limit: number,
    populate: PopulateOptions[] = []
  ): Promise<{ data: IBooking[]; total: number }> {
    const filter = { studentId: new Types.ObjectId(studentId) };
    return await this.paginate(
      filter,
      page,
      limit,
      { createdAt: -1 },
      populate
    );
  }
}
