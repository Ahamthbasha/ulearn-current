import { Types } from "mongoose";
import { ICart } from "../../models/cartModel";
import { IStudentCartService } from "./interface/IStudentCartService"; 
import { IStudentCartRepository } from "../../repositories/interfaces/IStudentCartRepository";
import { CartCourseDTO } from "../../dto/userDTO/cartCourseDTO";
import { mapCartToDTO } from "../../mappers/userMapper/cartMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";

export class StudentCartService implements IStudentCartService {
  private _cartRepository: IStudentCartRepository;
  
  constructor(cartRepository: IStudentCartRepository) {
    this._cartRepository = cartRepository;
  }

  async getCart(userId: Types.ObjectId): Promise<CartCourseDTO[] | null> {
    const cart = await this._cartRepository.findCartByUserId(userId);
    
    if (!cart) {
      return null;
    }

    const cartDTO = mapCartToDTO(cart);
    
    // Handle presigned URLs for course thumbnails
    for (const course of cartDTO) {
      if (course.thumbnailUrl) {
        course.thumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
      }
    }

    return cartDTO;
  }

  async addToCart(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<CartCourseDTO[] | null> {
    const updatedCart = await this._cartRepository.addCourse(userId, courseId);
    
    if (!updatedCart) {
      return null;
    }

    const cartDTO = mapCartToDTO(updatedCart);
    
    // Handle presigned URLs for course thumbnails
    for (const course of cartDTO) {
      if (course.thumbnailUrl) {
        course.thumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
      }
    }

    return cartDTO;
  }

  async removeFromCart(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<CartCourseDTO[] | null> {
    const updatedCart = await this._cartRepository.removeCourse(userId, courseId);
    
    if (!updatedCart) {
      return null;
    }

    const cartDTO = mapCartToDTO(updatedCart);
    
    // Handle presigned URLs for course thumbnails
    for (const course of cartDTO) {
      if (course.thumbnailUrl) {
        course.thumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
      }
    }

    return cartDTO;
  }

  async clearCart(userId: Types.ObjectId): Promise<boolean> {
    const clearedCart = await this._cartRepository.clear(userId);
    return !!clearedCart;
  }

  // For internal use when raw cart data is needed
  async getCartRaw(userId: Types.ObjectId): Promise<ICart | null> {
    return await this._cartRepository.findCartByUserId(userId);
  }
}