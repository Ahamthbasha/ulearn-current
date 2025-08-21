import { IStudentSlotBookingRepository } from "./interface/IStudentSlotBookingRepository";
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
    update: Partial<IBooking>,
  ): Promise<void> {
    await this.update(id, update);
  }

  async findBookingById(
    id: string,
    populate: PopulateOptions[] = [],
  ): Promise<IBooking | null> {
    if (populate.length) {
      return await this.findByIdWithPopulate(id, populate);
    }
    return await this.findById(id);
  }

  async findOne(
    filter: object,
    populate?: PopulateOptions[],
  ): Promise<IBooking | null> {
    return await super.findOne(filter, populate);
  }

  async findAllBookingsByStudentPaginated(
    studentId: string,
    page: number,
    limit: number,
    searchQuery?: string,
    populate: PopulateOptions[] = [],
  ): Promise<{ data: IBooking[]; total: number }> {
    // If no search query, use the existing paginate method
    if (!searchQuery || !searchQuery.trim()) {
      const filter = { studentId: new Types.ObjectId(studentId) };
      return await this.paginate(
        filter,
        page,
        limit,
        { createdAt: -1 },
        populate,
      );
    }

    // Handle search with aggregation
    const trimmedQuery = searchQuery.trim();

    const pipeline: any[] = [
      // Match by studentId first
      { $match: { studentId: new Types.ObjectId(studentId) } },
    ];

    if (Types.ObjectId.isValid(trimmedQuery) && trimmedQuery.length === 24) {
      // Exact ObjectId match
      pipeline[0].$match._id = new Types.ObjectId(trimmedQuery);
    } else {
      // Partial match using string conversion
      pipeline.push({
        $match: {
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: trimmedQuery,
              options: "i",
            },
          },
        },
      });
    }

    // Add sorting
    pipeline.push({ $sort: { createdAt: -1 } });

    // Get total count
    const countPipeline = [...pipeline, { $count: "total" }];
    const totalResult = await this.aggregate(countPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    // Execute aggregation
    let data = await this.aggregate<IBooking>(pipeline);

    // Apply population if needed - Use BookingModel.populate() instead of this.populate()
    if (populate.length > 0) {
      data = await BookingModel.populate(data, populate);
    }

    return { data, total };
  }
}
