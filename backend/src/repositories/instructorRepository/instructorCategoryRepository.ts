import { CategoryModel, ICategoryModel } from "../../models/categoryModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorCategoryRepository } from "./interface/IInstructorCategoryRepository";

export class InstructorCategoryRepository
  extends GenericRepository<ICategoryModel>
  implements IInstructorCategoryRepository
{
  constructor() {
    super(CategoryModel);
  }

  async getListedCategories(): Promise<
    Pick<ICategoryModel, "_id" | "categoryName">[]
  > {
    return (await this.findWithProjection(
      { isListed: true },
      { _id: 1, categoryName: 1 },
    )) as Pick<ICategoryModel, "_id" | "categoryName">[];
  }
}
