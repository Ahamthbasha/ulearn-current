import {Types} from "mongoose"
import { CartItemDTO } from "../../../dto/userDTO/cartCourseDTO";
import { ICart } from "../../../models/cartModel";

export interface IStudentCartService {
  getCart(userId: Types.ObjectId): Promise<CartItemDTO[] | null>;
  addToCart(userId: Types.ObjectId, itemId: Types.ObjectId, type: "course" | "learningPath"): Promise<CartItemDTO[] | null>;
  removeFromCart(userId: Types.ObjectId, itemId: Types.ObjectId, type: "course" | "learningPath"): Promise<CartItemDTO[] | null>;
  clearCart(userId: Types.ObjectId): Promise<boolean>;
  getCartRaw(userId: Types.ObjectId): Promise<ICart | null>;
}