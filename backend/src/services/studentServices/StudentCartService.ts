import { Types } from "mongoose";
import { ICart } from "../../models/cartModel";
import { IStudentCartService } from "./interface/IStudentCartService";
import { IStudentCartRepository } from "../../repositories/interfaces/IStudentCartRepository";
import { CartCourseDTO } from "../../dto/userDTO/cartCourseDTO";
import { mapCartToDTO } from "../../mappers/userMapper/cartMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { IStudentCourseRepository } from "../../repositories/studentRepository/interface/IStudentCourseRepository";
import { PopulatedCartCourse } from "../../types/PopulatedCartCourse";

export class StudentCartService implements IStudentCartService {
  private _cartRepository: IStudentCartRepository;
  private _courseRepository: IStudentCourseRepository;

  constructor(cartRepository: IStudentCartRepository, courseRepository: IStudentCourseRepository) {
    this._cartRepository = cartRepository;
    this._courseRepository = courseRepository;
  }

  async getCart(userId: Types.ObjectId): Promise<CartCourseDTO[] | null> {
    const cart = await this._cartRepository.findCartByUserId(userId);

    if (!cart) {
      return null;
    }

    const courseIds = cart.courses.map((course) => {
      if (typeof course === 'object' && course !== null && '_id' in course) {
        return ((course as unknown) as PopulatedCartCourse)._id.toString();
      }
      return (course as Types.ObjectId).toString();
    });
    
    const courseDetailsPromises = courseIds.map((id) => this._courseRepository.getCourseDetails(id));
    const courseDetailsResults = await Promise.all(courseDetailsPromises);

    const courseDetailsMap = new Map<string, { price: number; thumbnailUrl: string }>();
    courseDetailsResults.forEach((details) => {
      if (details.course) {
        courseDetailsMap.set(details.course._id.toString(), {
          price: details.course.price,
          thumbnailUrl: details.course.thumbnailUrl || "",
        });
      }
    });

    const cartDTO = mapCartToDTO(cart, courseDetailsMap);

    for (const course of cartDTO) {
      if (course.thumbnailUrl) {
        const populatedCourse = cart.courses.find((c) => {
          if (typeof c === 'object' && c !== null && '_id' in c) {
            return ((c as unknown) as PopulatedCartCourse)._id.toString() === course.courseId;
          }
          return false;
        });
        
        const rawThumbnailUrl = populatedCourse && typeof populatedCourse === 'object' && 'thumbnailUrl' in populatedCourse
          ? ((populatedCourse as unknown) as PopulatedCartCourse).thumbnailUrl
          : course.thumbnailUrl;
        course.thumbnailUrl = await getPresignedUrl(rawThumbnailUrl);
      }
    }

    return cartDTO;
  }

  async addToCart(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<CartCourseDTO[] | null> {
    const updatedCart = await this._cartRepository.addCourse(userId, courseId);

    if (!updatedCart) {
      return null;
    }

    const courseDetails = await this._courseRepository.getCourseDetails(courseId.toString());
    if (!courseDetails.course) {
      throw new Error("Course not found");
    }

    const courseDetailsMap = new Map<string, { price: number; thumbnailUrl: string }>();
    courseDetailsMap.set(courseId.toString(), {
      price: courseDetails.course.price,
      thumbnailUrl: courseDetails.course.thumbnailUrl || "",
    });

    const cartDTO = mapCartToDTO(updatedCart, courseDetailsMap);

    for (const course of cartDTO) {
      if (course.thumbnailUrl) {
        const populatedCourse = updatedCart.courses.find((c) => {
          if (typeof c === 'object' && c !== null && '_id' in c) {
            return ((c as unknown) as PopulatedCartCourse)._id.toString() === course.courseId;
          }
          return false;
        });
        
        const rawThumbnailUrl = populatedCourse && typeof populatedCourse === 'object' && 'thumbnailUrl' in populatedCourse
          ? ((populatedCourse as unknown) as PopulatedCartCourse).thumbnailUrl
          : course.thumbnailUrl;
        course.thumbnailUrl = await getPresignedUrl(rawThumbnailUrl);
      }
    }

    return cartDTO;
  }

  async removeFromCart(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<CartCourseDTO[] | null> {
    const updatedCart = await this._cartRepository.removeCourse(
      userId,
      courseId,
    );

    if (!updatedCart) {
      return null;
    }

    const cartDTO = mapCartToDTO(updatedCart);

    for (const course of cartDTO) {
      if (course.thumbnailUrl) {
        const populatedCourse = updatedCart.courses.find((c) => {
          if (typeof c === 'object' && c !== null && '_id' in c) {
            return ((c as unknown) as PopulatedCartCourse)._id.toString() === course.courseId;
          }
          return false;
        });
        
        const rawThumbnailUrl = populatedCourse && typeof populatedCourse === 'object' && 'thumbnailUrl' in populatedCourse
          ? ((populatedCourse as unknown) as PopulatedCartCourse).thumbnailUrl
          : course.thumbnailUrl;
        course.thumbnailUrl = await getPresignedUrl(rawThumbnailUrl);
      }
    }

    return cartDTO;
  }

  async clearCart(userId: Types.ObjectId): Promise<boolean> {
    const clearedCart = await this._cartRepository.clear(userId);
    return !!clearedCart;
  }

  async getCartRaw(userId: Types.ObjectId): Promise<ICart | null> {
    return await this._cartRepository.findCartByUserId(userId);
  }
}