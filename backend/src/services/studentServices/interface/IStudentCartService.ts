import { Types } from "mongoose";
import { ICart } from "../../../models/cartModel";
import { CartCourseDTO } from "../../../dto/userDTO/cartCourseDTO";

export interface IStudentCartService {
  getCart(userId: Types.ObjectId): Promise<CartCourseDTO[] | null>;
  addToCart(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<CartCourseDTO[] | null>;
  removeFromCart(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<CartCourseDTO[] | null>;
  clearCart(userId: Types.ObjectId): Promise<boolean>;
  // For internal use when raw cart data is needed
  getCartRaw(userId: Types.ObjectId): Promise<ICart | null>;
}
