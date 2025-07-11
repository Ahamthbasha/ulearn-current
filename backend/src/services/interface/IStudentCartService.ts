import { Types } from "mongoose";
import { ICart } from "../../models/cartModel";

export interface IStudentCartService {
  getCart(userId: Types.ObjectId): Promise<ICart | null>;
  addToCart(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<ICart>;
  removeFromCart(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<ICart | null>;
  clearCart(userId: Types.ObjectId): Promise<ICart | null>;
}
