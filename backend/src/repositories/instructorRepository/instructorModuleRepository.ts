import {
  ModuleModel,
  CreateModuleDTO,
  IModule,
} from "../../models/moduleModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorChapterRepository } from "./interface/IInstructorChapterRepository";
import { IInstructorModuleRepository } from "./interface/IInstructorModuleRepository";

export class InstructorModuleRepository
  extends GenericRepository<IModule>
  implements IInstructorModuleRepository
{
  private _chapterRepository : IInstructorChapterRepository
  constructor(chapterRepository:IInstructorChapterRepository) {
    super(ModuleModel);
    this._chapterRepository = chapterRepository
  }

  async createModule(data: CreateModuleDTO): Promise<IModule> {
    const position = await this.getNextPosition({ courseId: data.courseId });
    const moduleData = {
      ...data,
      position,
      moduleNumber: position,
    };
    return this.create(moduleData);
  }

  async updateModuleDuration(moduleId: string): Promise<void> {
    const chapters = await this._chapterRepository.getChaptersByModule(moduleId);

    const totalDurationSeconds = chapters.reduce((sum, chapter) => {
      const dur = Number(chapter.duration) || 0;
      return sum + dur;
    }, 0);

    const updatedDuration = totalDurationSeconds.toString();

    await this.updateModule(moduleId, { duration: updatedDuration });
  }

  async getModulesByCourse(courseId: string): Promise<IModule[]> {
    const modules = await this.findAll({ courseId },undefined,{moduleNumber:1});
    return modules || [];
  }

  async getModuleById(moduleId: string): Promise<IModule | null> {
    return await this.findById(moduleId);
  }

  async updateModule(
    moduleId: string,
    data: Partial<IModule>
  ): Promise<IModule | null> {
    return await this.update(moduleId, data);
  }

 async deleteModule(moduleId: string): Promise<IModule | null> {
  const module = await this.findById(moduleId);
  if (!module) return null;

  const deleted = await this.model.findByIdAndDelete(moduleId);
  
  if (deleted) {
    await this.model.updateMany(
      {
        courseId: module.courseId,
        position: { $gt: module.position }
      },
      { $inc: { position: -1, moduleNumber: -1 } }
    );
  }

  return deleted;
}

  async findByTitleAndCourseId(
    courseId: string,
    moduleTitle: string,
    moduleId?: string
  ): Promise<IModule | null> {
    return this.findOne({
      courseId,
      _id: { $ne: moduleId },
      moduleTitle: { $regex: `^${moduleTitle}$`, $options: "i" },
    });
  }

  async paginateModules(
    filter: object,
    page: number,
    limit: number
  ): Promise<{ data: IModule[]; total: number }> {
    return this.paginate(filter, page, limit, { moduleNumber: 1 });
  }

  async reorderModules(courseId: string, orderedIds: string[]): Promise<void> {
  const operations = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, courseId },
      update: { position: index + 1, moduleNumber: index + 1 },
    },
  }));

  await this.model.bulkWrite(operations);
}

  private async getNextPosition(filter: object): Promise<number> {
    const last = await this.model
      .findOne(filter)
      .sort({ position: -1 })
      .select("position")
      .lean();
    return (last?.position ?? 0) + 1;
  }


}