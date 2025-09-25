import { IStudentSlotBookingRepository } from "./interface/IStudentSlotBookingRepository";
import { BookingModel, IBooking } from "../../models/bookingModel";
import { GenericRepository } from "../genericRepository";
import { PopulateOptions, Types, ClientSession } from "mongoose";

export class StudentSlotBookingRepository
  extends GenericRepository<IBooking>
  implements IStudentSlotBookingRepository
{
  constructor() {
    super(BookingModel);
  }

  async createBooking(
    booking: Partial<IBooking>,
    session?: ClientSession,
  ): Promise<IBooking> {
    if (session) {
      return await this.createWithSession(booking, session);
    }
    return (await this.create(booking)) as IBooking;
  }

  async updateBookingStatus(
    id: string,
    update: Partial<IBooking>,
    session?: ClientSession,
  ): Promise<void> {
    if (session) {
      await this.updateWithSession(id, update, session);
    } else {
      await this.update(id, update);
    }
  }

  async findBookingById(
    id: string,
    populate: PopulateOptions[] = [],
    session?: ClientSession,
  ): Promise<IBooking | null> {
    let query = this.model.findById(id);
    if (populate.length) query = query.populate(populate);
    if (session) query = query.session(session);
    return await query.exec();
  }

  async findOne(
    filter: object,
    populate: PopulateOptions[] = [],
    session?: ClientSession,
  ): Promise<IBooking | null> {
    return await super.findOne(filter, populate, session);
  }

  async markStalePendingBookingsAsFailed(
    slotId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<void> {
    const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
    const filter = {
      slotId,
      status: "pending",
      createdAt: { $lte: staleThreshold },
    };
    await this.updateMany(filter, { status: "failed" }, { session });
  }

  async findAllBookingsByStudentPaginated(
    studentId: string,
    page: number,
    limit: number,
    searchQuery?: string,
    populate: PopulateOptions[] = [],
  ): Promise<{ data: IBooking[]; total: number }> {
    const baseFilter = { studentId: new Types.ObjectId(studentId) ,
       status:{$in:["confirmed","pending","failed"]}
    };

    if (!searchQuery || !searchQuery.trim()) {
      return await this.paginate(
        baseFilter,
        page,
        limit,
        { createdAt: -1 },
        populate,
      );
    }

    const trimmedQuery = searchQuery.trim().toLowerCase();
    const validStatuses = ["confirmed", "pending", "failed"];
    const isStatusSearch = validStatuses.includes(trimmedQuery);
    const isValidObjectId =
      Types.ObjectId.isValid(trimmedQuery) && trimmedQuery.length === 24;

    let matchCondition: any = { ...baseFilter };

    if (isStatusSearch) {
      matchCondition.status = trimmedQuery;
    } else if (isValidObjectId) {
      matchCondition._id = new Types.ObjectId(trimmedQuery);
    } else {
      const pipeline: any[] = [
        { $match: baseFilter },
        {
          $match: {
            $expr: {
              $regexMatch: {
                input: { $toString: "$_id" },
                regex: trimmedQuery,
                options: "i",
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ];

      const countPipeline = [...pipeline, { $count: "total" }];
      const totalResult = await this.aggregate(countPipeline);
      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

      let data = await this.aggregate<IBooking>(pipeline);

      if (populate.length > 0) {
        data = await BookingModel.populate(data, populate);
      }

      return { data, total };
    }

    return await this.paginate(
      matchCondition,
      page,
      limit,
      { createdAt: -1 },
      populate,
    );
  }
}
