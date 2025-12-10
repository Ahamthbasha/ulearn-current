import { ICategoryModel } from "../../../models/categoryModel";

export interface IInstructorCategoryService {
  fetchActiveCategories(): Promise<
    Pick<ICategoryModel, "_id" | "categoryName">[]
  >;
}
