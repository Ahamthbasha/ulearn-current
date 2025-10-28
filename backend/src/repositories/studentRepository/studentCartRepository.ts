import { Types } from "mongoose";
import {
  ICart,
  CartModel,
  PopulatedCartCourse,
  PopulatedLearningPath,
} from "../../models/cartModel";
import { IStudentCartRepository } from "./interface/IStudentCartRepository";
import { GenericRepository } from "../genericRepository";

export class StudentCartRepository
  extends GenericRepository<ICart>
  implements IStudentCartRepository
{
  constructor() {
    super(CartModel);
  }

  async findCartByUserId(userId: Types.ObjectId): Promise<ICart | null> {
    const cartInfo = await this.findOne({ userId }, [
      { path: "courses" },
      { path: "learningPaths" },
    ]);
    return cartInfo
  }

  async addCourse(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<ICart> {
    let cart = await this.findOne({ userId });
    if (!cart) {
      cart = await this.create({
        userId,
        courses: [courseId],
        learningPaths: [],
      } as Partial<ICart>);
    } else if (Array.isArray(cart.courses)) {
      const alreadyExists = cart.courses.some(
        (c: Types.ObjectId | PopulatedCartCourse) =>
          (c instanceof Types.ObjectId ? c.toString() : c._id.toString()) ===
          courseId.toString(),
      );
      if (!alreadyExists) {
        (cart.courses as Types.ObjectId[]).push(courseId);
        await cart.save();
      }
    }
    const updatedCart = await this.findOne({ userId }, [
      { path: "courses" },
      { path: "learningPaths" },
    ]);
    if (!updatedCart) {
      throw new Error("Failed to retrieve updated cart after adding course");
    }
    return updatedCart;
  }

  async addLearningPath(
    userId: Types.ObjectId,
    learningPathId: Types.ObjectId,
  ): Promise<ICart> {
    let cart = await this.findOne({ userId });
    if (!cart) {
      cart = await this.create({
        userId,
        courses: [],
        learningPaths: [learningPathId],
      } as Partial<ICart>);
    } else if (Array.isArray(cart.learningPaths)) {
      const alreadyExists = cart.learningPaths.some(
        (lp: Types.ObjectId | PopulatedLearningPath) =>
          (lp instanceof Types.ObjectId ? lp.toString() : lp._id.toString()) ===
          learningPathId.toString(),
      );
      if (!alreadyExists) {
        (cart.learningPaths as Types.ObjectId[]).push(learningPathId);
        await cart.save();
      }
    }
    const updatedCart = await this.findOne({ userId }, [
      { path: "courses" },
      { path: "learningPaths" },
    ]);
    if (!updatedCart) {
      throw new Error(
        "Failed to retrieve updated cart after adding learning path",
      );
    }
    return updatedCart;
  }

  async removeCourse(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<ICart | null> {
    return await this.updateOneWithPopulate(
      { userId },
      { $pull: { courses: courseId } },
      [{ path: "courses" }, { path: "learningPaths" }],
    );
  }

  async removeLearningPath(
    userId: Types.ObjectId,
    learningPathId: Types.ObjectId,
  ): Promise<ICart | null> {
    return await this.updateOneWithPopulate(
      { userId },
      { $pull: { learningPaths: learningPathId } },
      [{ path: "courses" }, { path: "learningPaths" }],
    );
  }

  async clear(userId: Types.ObjectId): Promise<ICart | null> {
    return await this.updateOneWithPopulate(
      { userId },
      { $set: { courses: [], learningPaths: [] } },
      [{ path: "courses" }, { path: "learningPaths" }],
    );
  }
}
