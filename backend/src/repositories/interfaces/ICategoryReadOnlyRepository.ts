import { ICategoryModel } from "../../models/categoryModel";

export interface ICategoryReadOnlyRepository {
  getAllCategories(): Promise<ICategoryModel[]>;
}
