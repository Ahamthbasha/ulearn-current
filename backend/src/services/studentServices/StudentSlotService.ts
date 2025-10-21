import { IStudentSlotRepository } from "../../repositories/studentRepository/interface/IStudentSlotRepository";
import { IStudentSlotService } from "./interface/IStudentSlotService";
import { groupSlotsByDate } from "../../mappers/userMapper/studentSlotMapper"; 
import { StudentSlotDTO } from "../../dto/userDTO/studentSlotDTO";

export class StudentSlotService implements IStudentSlotService {
  private _slotRepo: IStudentSlotRepository;

  constructor(repo: IStudentSlotRepository) {
    this._slotRepo = repo;
  }

  async getAvailableSlots(instructorId: string): Promise<Record<string, StudentSlotDTO[]>> {
    const slots = await this._slotRepo.getAvailableSlotsByInstructorId(instructorId);
    return groupSlotsByDate(slots);
  }
}