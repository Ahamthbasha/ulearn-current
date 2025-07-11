import { Types } from "mongoose";
import { ICart } from "../../models/cartModel";

export interface IStudentCartRepository {
  findCartByUserId(userId: Types.ObjectId): Promise<ICart | null>;
  addCourse(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<ICart>;
  removeCourse(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<ICart | null>;
  clear(userId: Types.ObjectId): Promise<ICart | null>;
}
