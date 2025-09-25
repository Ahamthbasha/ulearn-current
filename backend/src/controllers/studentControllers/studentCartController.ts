import { Response } from "express";
import { Types } from "mongoose";
import { IStudentCartService } from "../../services/studentServices/interface/IStudentCartService";
import { IStudentCartController } from "./interfaces/IStudentCartController";
import { StatusCode } from "../../utils/enums";
import {
  CartErrorMessage,
  CartSuccessMessage,
  StudentErrorMessages,
} from "../../utils/constants";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";

export class StudentCartController implements IStudentCartController {
  private _cartService: IStudentCartService;

  constructor(cartService: IStudentCartService) {
    this._cartService = cartService;
  }

  async getCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const cartData = await this._cartService.getCart(userId);

      if (cartData && cartData.length > 0) {
        res.status(StatusCode.OK).json({
          success: true,
          message: CartSuccessMessage.CART_DATA_FETCHED,
          data: cartData,
        });
      } else {
        res.status(StatusCode.OK).json({
          success: true,
          message: CartSuccessMessage.CART_EMPTY,
          data: [],
        });
      }
    } catch (error) {
      console.error("getCart error:", error);
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: StudentErrorMessages.TOKEN_INVALID,
      });
    }
  }

  async addToCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const courseId = new Types.ObjectId(req.body.courseId);

      const rawCart = await this._cartService.getCartRaw(userId);
      const alreadyInCart = rawCart?.courses.some(
        (c) => c.toString() === courseId.toString(),
      );

      if (alreadyInCart) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          message: CartErrorMessage.COURSE_ALREADYEXIST_IN_CART,
        });
        return;
      }

      const updatedCartData = await this._cartService.addToCart(
        userId,
        courseId,
      );

      if (!updatedCartData) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: CartErrorMessage.FAILED_TO_ADD_COURSE_IN_CART,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: CartSuccessMessage.COURSE_ADDED_IN_CART,
        data: updatedCartData,
      });
    } catch (error) {
      console.error("addToCart error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: CartErrorMessage.FAILED_TO_ADD_COURSE_IN_CART,
      });
    }
  }

  async removeFromCart(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const courseId = new Types.ObjectId(req.params.courseId);

      const updatedCartData = await this._cartService.removeFromCart(
        userId,
        courseId,
      );

      if (updatedCartData === null) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: CartErrorMessage.FAILED_TO_REMOVE_COURSE_FROM_CART,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: CartSuccessMessage.COURSE_REMOVED_FROM_CART,
        data: updatedCartData,
      });
    } catch (error) {
      console.error("removeFromCart error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: CartErrorMessage.FAILED_TO_REMOVE_COURSE_FROM_CART,
      });
    }
  }

  async clearCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const isCleared = await this._cartService.clearCart(userId);

      if (!isCleared) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: CartErrorMessage.FAILED_TO_CLEAR_CARTDATE,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: CartSuccessMessage.CART_DATA_CLEARED,
        data: [],
      });
    } catch (error) {
      console.error("clearCart error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: CartErrorMessage.FAILED_TO_CLEAR_CARTDATE,
      });
    }
  }
}
