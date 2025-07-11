import { Types } from "mongoose";
import { ICart } from "../../models/cartModel";
import { IStudentCartService } from "../interface/IStudentCartService";
import { IStudentCartRepository } from "../../repositories/interfaces/IStudentCartRepository";

export class StudentCartService implements IStudentCartService {
  private cartRepository: IStudentCartRepository
  constructor(cartRepository: IStudentCartRepository) {
    this.cartRepository = cartRepository
  }

  async getCart(userId: Types.ObjectId): Promise<ICart | null> {
    return await this.cartRepository.findCartByUserId(userId);
  }

  async addToCart(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<ICart> {
    return await this.cartRepository.addCourse(userId, courseId);
  }

  async removeFromCart(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<ICart | null> {
    return await this.cartRepository.removeCourse(userId, courseId);
  }

  async clearCart(userId: Types.ObjectId): Promise<ICart | null> {
    return await this.cartRepository.clear(userId);
  }
}
