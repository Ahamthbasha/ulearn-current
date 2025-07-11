import { ICategoryReadOnlyRepository } from "../interfaces/ICategoryReadOnlyRepository";
import { ICategoryModel, CategoryModel } from "../../models/categoryModel";
import { GenericRepository } from "../genericRepository";

export class CategoryReadOnlyRepository extends GenericRepository<ICategoryModel> implements ICategoryReadOnlyRepository {
    constructor(){
        super(CategoryModel)
    }
 async getAllCategories(): Promise<ICategoryModel[]> {
  const categories = await this.findAll({ isListed: true }, undefined, { categoryName: 1 });
  return categories ?? []; // return empty array if null
}

}
