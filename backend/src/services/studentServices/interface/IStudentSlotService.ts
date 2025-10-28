import { StudentSlotDTO } from "../../../dto/userDTO/studentSlotDTO";

export interface IStudentSlotService {
  getAvailableSlots(
    instructorId: string,
  ): Promise<Record<string, StudentSlotDTO[]>>;
}
