import { PopulateOptions } from "mongoose";
import { ISlot } from "../../../models/slotModel";

export interface IStudentSlotRepository {
  getAvailableSlotsByInstructorId(instructorId: string): Promise<ISlot[]>;
  findById(slotId: string): Promise<ISlot | null>;
  update(slotId: string, update: Partial<ISlot>): Promise<ISlot | null>;

  findOne(filter: object, populate?: PopulateOptions[]): Promise<ISlot | null>;
}




