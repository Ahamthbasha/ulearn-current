import { ISlot } from "../../../models/slotModel";

export interface IStudentSlotService {
  getAvailableSlots(instructorId: string): Promise<ISlot[]>;
}
