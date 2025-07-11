import { ICategoryModel } from "../../models/categoryModel";

export interface IInstructorCategoryRepository {
  getListedCategories(): Promise<ICategoryModel[]>;
}
