import { ICategoryReadOnlyService } from "../interface/ICategoryReadOnlyService";
import { ICategoryReadOnlyRepository } from "../../repositories/interfaces/ICategoryReadOnlyRepository";
import { ICategoryModel } from "../../models/categoryModel";

export class CategoryReadOnlyService implements ICategoryReadOnlyService {
  private categoryRepo: ICategoryReadOnlyRepository;

  constructor(categoryRepo: ICategoryReadOnlyRepository) {
    this.categoryRepo = categoryRepo;
  }

  async getAllCategories(): Promise<ICategoryModel[]> {
    return await this.categoryRepo.getAllCategories();
  }
}
