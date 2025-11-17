import { IStudentSlotRepository } from "./interface/IStudentSlotRepository";
import { ISlot } from "../../models/slotModel";
import slotModel from "../../models/slotModel";
import { GenericRepository } from "../genericRepository";
import { ClientSession, PopulateOptions } from "mongoose";
import { addMonths } from "date-fns";

export class StudentSlotRepository
  extends GenericRepository<ISlot>
  implements IStudentSlotRepository
{
  constructor() {
    super(slotModel);
  }

  async getAvailableSlotsByInstructorId(
    instructorId: string,
    session?: ClientSession,
  ): Promise<ISlot[]> {
    const nowUTC = new Date();

    const futureLimit = addMonths(nowUTC, 3);

    let query = this.model
      .find({
        instructorId,
        isBooked: false,
        startTime: {
          $gte: nowUTC,
          $lte: futureLimit,
        },
      })
      .sort({ startTime: 1 })
      .lean(); 

    if (session) {
      query = query.session(session);
    }

    return await query.exec();
  }

  async findById(slotId: string, session?: ClientSession): Promise<ISlot | null> {
    let query = this.model.findById(slotId);
    if (session) query = query.session(session);
    return await query.exec();
  }

  async findOne(
    filter: object,
    populate: PopulateOptions[] = [],
    session?: ClientSession,
  ): Promise<ISlot | null> {
    let query = this.model.findOne(filter);
    if (session) query = query.session(session);
    populate.forEach((pop) => (query = query.populate(pop)));
    return await query.exec();
  }

  async getSlotByIdWithLock(
    slotId: string,
    session: ClientSession,
  ): Promise<ISlot | null> {
    return await this.model.findById(slotId).session(session).exec();
  }

  async updateWithSession(
    id: string,
    data: any,
    session: ClientSession,
  ): Promise<ISlot | null> {
    return await this.model
      .findByIdAndUpdate(id, data, { new: true })
      .session(session)
      .exec();
  }
}