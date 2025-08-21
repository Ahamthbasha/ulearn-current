import { ICategoryReadOnlyService } from "../interface/ICategoryReadOnlyService";
import { ICategoryReadOnlyRepository } from "../../repositories/interfaces/ICategoryReadOnlyRepository";
import { ICategoryModel } from "../../models/categoryModel";

export class CategoryReadOnlyService implements ICategoryReadOnlyService {
  private _categoryRepo: ICategoryReadOnlyRepository;

  constructor(categoryRepo: ICategoryReadOnlyRepository) {
    this._categoryRepo = categoryRepo;
  }

  async getAllCategories(): Promise<ICategoryModel[]> {
    return await this._categoryRepo.getAllCategories();
  }
}
