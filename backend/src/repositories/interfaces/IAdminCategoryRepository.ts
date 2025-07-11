import { ICategoryModel } from "../../models/categoryModel";
import { IGenericRepository } from "../genericRepository";

export interface IAdminCategoryRepository extends IGenericRepository<ICategoryModel>{
    findCategoryByName(categoryName:string):Promise<ICategoryModel | null>
    listOrUnlistCategory(id: string): Promise<ICategoryModel | null>;

   getAllCategoriesPaginated(page: number, limit: number, search?: string): Promise<{ data: ICategoryModel[]; total: number }>;

}