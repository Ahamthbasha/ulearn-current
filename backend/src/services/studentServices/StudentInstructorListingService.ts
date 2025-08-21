import { IStudentInstructorListingService } from "./interface/IStudentInstructorListingService"; 
import { IStudentInstructorListingRepository } from "../../repositories/studentRepository/interface/IStudentInstructorListingRepository"; 
import { IInstructor } from "../../models/instructorModel";
import { getPresignedUrl } from "../../utils/getPresignedUrl";

export class StudentInstructorListingService
  implements IStudentInstructorListingService
{
  private _instructorListingRepo: IStudentInstructorListingRepository;

  constructor(repo: IStudentInstructorListingRepository) {
    this._instructorListingRepo = repo;
  }

  async getPaginatedMentors(
  page: number,
  limit: number,
  search?: string,
  sortOrder?: "asc" | "desc",
  skill?: string,
  expertise?: string
): Promise<{ data: IInstructor[]; total: number }> {
  const { data, total } =
    await this._instructorListingRepo.listMentorInstructorsPaginated(
      page,
      limit,
      search,
      sortOrder,
      skill,
      expertise
    );

  const updatedData = await Promise.all(
    data.map(async (mentor) => {
      if (mentor.profilePicUrl) {
        mentor.profilePicUrl = await getPresignedUrl(mentor.profilePicUrl);
      }
      return mentor;
    })
  );

  return { data: updatedData as IInstructor[], total };
}


  async getMentorById(id: string): Promise<IInstructor | null> {
    const mentor = await this._instructorListingRepo.getMentorInstructorById(id);
    if (!mentor) return null;

    const mentorObj = mentor.toObject();
    if (mentor.profilePicUrl) {
      mentorObj.profilePicUrl = await getPresignedUrl(mentor.profilePicUrl);
    }
    return mentorObj as IInstructor;
  }

  async getAvailableFilters(): Promise<{ skills: string[]; expertise: string[] }> {
  return await this._instructorListingRepo.getAvailableSkillsAndExpertise();
}
}
