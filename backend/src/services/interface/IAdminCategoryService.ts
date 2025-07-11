import { ICategoryModel } from "../../models/categoryModel";

export interface IAdminCategoryService{
    findCategoryByName(categoryName:string):Promise<ICategoryModel | null>
    
    findCategoryById(categoryId:string):Promise<ICategoryModel|null>
    
    addCategory(categoryName:string):Promise<ICategoryModel|null>

    updateCategory(id:string,categoryName:string):Promise<ICategoryModel | null>

    getAllCategory():Promise<ICategoryModel[] | null>

    listOrUnlistCategory(id:string):Promise<ICategoryModel | null>

    getAllCategoriesPaginated(page: number, limit: number, search?: string): Promise<{ data: ICategoryModel[]; total: number }>;

}