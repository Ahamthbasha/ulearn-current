import { CategoryModel, ICategoryModel } from "../../models/categoryModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorCategoryRepository } from "../interfaces/IInstructorCategoryRepository";

export class InstructorCategoryRepository
  extends GenericRepository<ICategoryModel>
  implements IInstructorCategoryRepository
{
  constructor() {
    super(CategoryModel); // ✅ Pass the model to GenericRepository
  }

  async getListedCategories(): Promise<ICategoryModel[]> {
    return await CategoryModel.find({ isListed: true }).select("categoryName");
  }
}
