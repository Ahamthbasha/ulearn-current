import { ISlot } from "../../models/slotModel";
import { IStudentSlotRepository } from "../../repositories/studentRepository/interface/IStudentSlotRepository"; 
import { IStudentSlotService } from "./interface/IStudentSlotService"; 

export class StudentSlotService implements IStudentSlotService {
  private _slotRepo: IStudentSlotRepository;

  constructor(repo: IStudentSlotRepository) {
    this._slotRepo = repo;
  }

  async getAvailableSlots(instructorId: string): Promise<ISlot[]> {
    return await this._slotRepo.getAvailableSlotsByInstructorId(instructorId);
  }
}
