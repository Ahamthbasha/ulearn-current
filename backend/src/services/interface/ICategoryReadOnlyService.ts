import { ICategoryModel } from "../../models/categoryModel";

export interface ICategoryReadOnlyService {
  getAllCategories(): Promise<ICategoryModel[]>;
}
