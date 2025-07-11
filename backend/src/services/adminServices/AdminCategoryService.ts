import { IAdminCategoryRepository } from "../../repositories/interfaces/IAdminCategoryRepository";
import { ICategoryModel } from "../../models/categoryModel";
import { IAdminCategoryService } from "../../services/interface/IAdminCategoryService";

export class AdminCategoryService implements IAdminCategoryService {
  private adminCategoryRepository: IAdminCategoryRepository;

  constructor(adminCategoryRepository: IAdminCategoryRepository) {
    this.adminCategoryRepository = adminCategoryRepository;
  }

  async findCategoryByName(
    categoryName: string
  ): Promise<ICategoryModel | null> {
    return this.adminCategoryRepository.findCategoryByName(categoryName);
  }

  async findCategoryById(categoryId: string): Promise<ICategoryModel | null> {
    return this.adminCategoryRepository.findById(categoryId);
  }

  async addCategory(categoryName: string): Promise<ICategoryModel | null> {
    return this.adminCategoryRepository.create({ categoryName });
  }

  async updateCategory(
    id: string,
    categoryName: string
  ): Promise<ICategoryModel | null> {
    return this.adminCategoryRepository.update(id, { categoryName });
  }

  async getAllCategory(): Promise<ICategoryModel[] | null> {
    return this.adminCategoryRepository.findAll();
  }

  async listOrUnlistCategory(id: string): Promise<ICategoryModel | null> {
    return this.adminCategoryRepository.listOrUnlistCategory(id);
  }

  async getAllCategoriesPaginated(
  page: number,
  limit: number,
  search: string = ""
): Promise<{ data: ICategoryModel[]; total: number }> {
  return await this.adminCategoryRepository.getAllCategoriesPaginated(page, limit, search);
}

}