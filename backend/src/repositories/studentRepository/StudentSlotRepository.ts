import { IStudentSlotRepository } from "./interface/IStudentSlotRepository";
import { ISlot } from "../../models/slotModel";
import slotModel from "../../models/slotModel";
import { GenericRepository } from "../genericRepository";
import { ClientSession, PopulateOptions } from "mongoose";

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
    const now = new Date();
    console.log("Current time:", now.toISOString());

    let query = this.model
      .find({
        instructorId,
        isBooked: false,
        startTime: { $gt: now },
      })
      .sort({ startTime: 1 });

    if (session) query = query.session(session);

    return await query.exec();
  }

  async findById(
    slotId: string,
    session?: ClientSession,
  ): Promise<ISlot | null> {
    let query = this.model.findById(slotId);
    if (session) query = query.session(session);
    return await query.exec();
  }

  async update(
    slotId: string,
    update: Partial<ISlot>,
    session?: ClientSession,
  ): Promise<ISlot | null> {
    let query = this.model.findByIdAndUpdate(slotId, update, { new: true });
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
}
