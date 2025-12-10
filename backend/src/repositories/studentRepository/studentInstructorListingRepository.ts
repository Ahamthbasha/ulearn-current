import { IStudentInstructorListingRepository } from "./interface/IStudentInstructorListingRepository";
import InstructorModel, { IInstructor } from "../../models/instructorModel";
import { GenericRepository } from "../genericRepository";
import { FilterQuery, PipelineStage } from "mongoose";

export class StudentInstructorListingRepository
  extends GenericRepository<IInstructor>
  implements IStudentInstructorListingRepository
{
  constructor() {
    super(InstructorModel);
  }

  async listMentorInstructorsPaginated(
    page: number,
    limit: number,
    search?: string,
    sortOrder: "asc" | "desc" = "asc",
    skill?: string,
    expertise?: string,
  ): Promise<{ data: IInstructor[]; total: number }> {
    const match: FilterQuery<IInstructor> = {
      isMentor: true,
      isBlocked: false,
    };

    if (search) {
      match.username = { $regex: search, $options: "i" };
    }

    if (skill) {
      match.skills = skill;
    }

    if (expertise) {
      match.expertise = expertise;
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $addFields: {
          usernameLower: { $toLower: "$username" },
        },
      },
      {
        $sort: {
          usernameLower: sortOrder === "desc" ? -1 : 1,
        },
      },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const [data, total] = await Promise.all([
      this.aggregate<IInstructor>(pipeline),
      this.countDocuments(match),
    ]);

    return { data, total };
  }

  async getMentorInstructorById(id: string): Promise<IInstructor | null> {
    return await this.findOne({ _id: id, isMentor: true, isBlocked: false });
  }

  async getAvailableSkillsAndExpertise(): Promise<{
    skills: string[];
    expertise: string[];
  }> {
    const skillsPipeline: PipelineStage[] = [
      { $match: { isMentor: true, isBlocked: false } },
      { $unwind: "$skills" },
      { $group: { _id: "$skills" } },
      { $project: { _id: 0, skill: "$_id" } },
    ];

    const expertisePipeline: PipelineStage[] = [
      { $match: { isMentor: true, isBlocked: false } },
      { $unwind: "$expertise" },
      { $group: { _id: "$expertise" } },
      { $project: { _id: 0, expertise: "$_id" } },
    ];

    const [skillsResult, expertiseResult] = await Promise.all([
      this.aggregate<{ skill: string }>(skillsPipeline),
      this.aggregate<{ expertise: string }>(expertisePipeline),
    ]);

    return {
      skills: skillsResult.map((s) => s.skill),
      expertise: expertiseResult.map((e) => e.expertise),
    };
  }
}
