import { ISlot } from "../../models/slotModel";
import { IStudentSlotRepository } from "../../repositories/interfaces/IStudentSlotRepository";
import { IStudentSlotService } from "../interface/IStudentSlotService";

export class StudentSlotService implements IStudentSlotService {
  private slotRepo: IStudentSlotRepository;

  constructor(repo: IStudentSlotRepository) {
    this.slotRepo = repo;
  }

  async getAvailableSlots(instructorId: string): Promise<ISlot[]> {
    return await this.slotRepo.getAvailableSlotsByInstructorId(instructorId);
  }
}
