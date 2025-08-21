import { IAdminCategoryRepository } from "../../repositories/adminRepository/interface/IAdminCategoryRepository"; 
import { ICategoryModel } from "../../models/categoryModel";
import { IAdminCategoryService } from "./interface/IAdminCategoryService"; 

export class AdminCategoryService implements IAdminCategoryService {
  private _adminCategoryRepository: IAdminCategoryRepository;

  constructor(adminCategoryRepository: IAdminCategoryRepository) {
    this._adminCategoryRepository = adminCategoryRepository;
  }

  async findCategoryByName(
    categoryName: string
  ): Promise<ICategoryModel | null> {
    return this._adminCategoryRepository.findCategoryByName(categoryName);
  }

  async findCategoryById(categoryId: string): Promise<ICategoryModel | null> {
    return this._adminCategoryRepository.findById(categoryId);
  }

  async addCategory(categoryName: string): Promise<ICategoryModel | null> {
    return this._adminCategoryRepository.create({ categoryName });
  }

  async updateCategory(
    id: string,
    categoryName: string
  ): Promise<ICategoryModel | null> {
    return this._adminCategoryRepository.update(id, { categoryName });
  }

  async getAllCategory(): Promise<ICategoryModel[] | null> {
    return this._adminCategoryRepository.findAll();
  }

  async listOrUnlistCategory(id: string): Promise<ICategoryModel | null> {
    return this._adminCategoryRepository.listOrUnlistCategory(id);
  }

  async getAllCategoriesPaginated(
  page: number,
  limit: number,
  search: string = ""
): Promise<{ data: ICategoryModel[]; total: number }> {
  return await this._adminCategoryRepository.getAllCategoriesPaginated(page, limit, search);
}

}