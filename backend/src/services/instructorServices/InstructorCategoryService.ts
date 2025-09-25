import { IInstructorCategoryService } from "./interface/IInstructorCategoryService";
import { IInstructorCategoryRepository } from "../../repositories/instructorRepository/interface/IInstructorCategoryRepository";
import { ICategoryModel } from "../../models/categoryModel";

export class InstructorCategoryService implements IInstructorCategoryService {
  private _categoryRepo: IInstructorCategoryRepository;

  constructor(categoryRepo: IInstructorCategoryRepository) {
    this._categoryRepo = categoryRepo;
  }

  async fetchActiveCategories(): Promise<
    Pick<ICategoryModel, "_id" | "categoryName">[]
  > {
    return await this._categoryRepo.getListedCategories();
  }
}
