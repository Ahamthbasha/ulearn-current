import { ICategoryModel } from "../../models/categoryModel";

export interface IInstructorCategoryService {
  fetchActiveCategories(): Promise<ICategoryModel[]>;
}
