import { ClientSession, PopulateOptions } from "mongoose";
import { ISlot } from "../../../models/slotModel";

export interface IStudentSlotRepository {
  getAvailableSlotsByInstructorId(
    instructorId: string,
    session?: ClientSession
  ): Promise<ISlot[]>;
  findById(slotId: string, session?: ClientSession): Promise<ISlot | null>;
  update(
    slotId: string,
    update: Partial<ISlot>,
    session?: ClientSession
  ): Promise<ISlot | null>;
  findOne(
    filter: object,
    populate?: PopulateOptions[],
    session?: ClientSession
  ): Promise<ISlot | null>;
  getSlotByIdWithLock(slotId: string, session: ClientSession): Promise<ISlot | null>;
}