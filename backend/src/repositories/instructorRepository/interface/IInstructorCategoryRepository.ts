import { ICategoryModel } from "../../../models/categoryModel";

export interface IInstructorCategoryRepository {
  getListedCategories(): Promise<
    Pick<ICategoryModel, "_id" | "categoryName">[]
  >;
}
