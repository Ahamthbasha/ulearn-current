import { ICategoryModel,CategoryModel } from "../../models/categoryModel";

import { GenericRepository } from "../genericRepository";

import { IAdminCategoryRepository } from "../interfaces/IAdminCategoryRepository";

import { CategoryErrorMsg } from "../../utils/constants";

export class AdminCategoryRepository extends GenericRepository<ICategoryModel> implements IAdminCategoryRepository{
    constructor(){
        super(CategoryModel)
    }
    
async getAllCategoriesPaginated(page: number,limit: number,search: string = ""): Promise<{ data: ICategoryModel[]; total: number }> {
  try {
    const filter = search
      ? { categoryName: { $regex: new RegExp(search, "i") } }
      : {};

    return await this.paginate(filter, page, limit, { createdAt: -1 });
  } catch (error) {
    throw error;
  }
}
    async findCategoryByName(categoryName: string): Promise<ICategoryModel | null> {
        return this.findOne({categoryName:{$regex:new RegExp(`^${categoryName}$`,'i')}})
    }

    async listOrUnlistCategory(id: string): Promise<ICategoryModel | null> {
        const category = await this.findById(id)
        if(!category){
            throw new Error(CategoryErrorMsg.CATEGORY_NOT_FOUND)
        }

        return this.update(id,{isListed:!category.isListed})
    }
}