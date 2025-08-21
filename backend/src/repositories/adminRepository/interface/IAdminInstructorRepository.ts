import { IInstructor } from "../../../models/instructorModel";

export interface IAdminInstructorRepository {
  getAllInstructors(
    page: number,
    limit: number,
    search: string,
  ): Promise<{ instructors: IInstructor[]; total: number }>;

  getInstructorData(email: string): Promise<IInstructor | null>;

  updateInstructorProfile(email: string, data: any): Promise<any>;
}
