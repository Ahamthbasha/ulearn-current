import { IInstructorCategoryService } from "../interface/IInstructorCategoryService";
import { IInstructorCategoryRepository } from "../../repositories/interfaces/IInstructorCategoryRepository";
import { ICategoryModel } from "../../models/categoryModel";

export class InstructorCategoryService implements IInstructorCategoryService {
  private categoryRepo: IInstructorCategoryRepository;

  constructor(categoryRepo: IInstructorCategoryRepository) {
    this.categoryRepo = categoryRepo;
  }

  async fetchActiveCategories(): Promise<ICategoryModel[]> {
    return await this.categoryRepo.getListedCategories();
  }
}
