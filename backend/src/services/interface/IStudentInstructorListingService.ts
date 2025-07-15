import { IInstructor } from "../../models/instructorModel";

export interface IStudentInstructorListingService {
  getPaginatedMentors(
    page: number,
    limit: number,
    search?: string,
    sortOrder?: "asc" | "desc",
    skill?: string,
    expertise?: string
  ): Promise<{ data: IInstructor[]; total: number }>;

  getMentorById(id: string): Promise<IInstructor | null>;

  getAvailableFilters(): Promise<{ skills: string[]; expertise: string[] }>;

}
