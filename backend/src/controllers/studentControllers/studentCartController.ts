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
import { PopulatedCartCourse, PopulatedLearningPath } from "../../models/cartModel";

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
      const itemId = new Types.ObjectId(req.body.itemId);
      const type = req.body.type as "course" | "learningPath";

      if (!["course", "learningPath"].includes(type)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: CartErrorMessage.INVALID_ITEM_TYPE,
        });
        return;
      }

      const rawCart = await this._cartService.getCartRaw(userId);
      let alreadyInCart = false;
      if (rawCart) {
        if (type === "course" && Array.isArray(rawCart.courses)) {
          alreadyInCart = rawCart.courses.some(
            (c: Types.ObjectId | PopulatedCartCourse) =>
              (c instanceof Types.ObjectId ? c.toString() : c._id.toString()) === itemId.toString()
          );
        } else if (type === "learningPath" && Array.isArray(rawCart.learningPaths)) {
          alreadyInCart = rawCart.learningPaths.some(
            (lp: Types.ObjectId | PopulatedLearningPath) =>
              (lp instanceof Types.ObjectId ? lp.toString() : lp._id.toString()) === itemId.toString()
          );
        }
      }

      if (alreadyInCart) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          message:
            type === "course"
              ? CartErrorMessage.COURSE_ALREADYEXIST_IN_CART
              : CartErrorMessage.LEARNING_PATH_ALREADYEXIST_IN_CART,
        });
        return;
      }

      const updatedCartData = await this._cartService.addToCart(userId, itemId, type);

      if (!updatedCartData) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message:
            type === "course"
              ? CartErrorMessage.FAILED_TO_ADD_COURSE_IN_CART
              : CartErrorMessage.FAILED_TO_ADD_LEARNING_PATH_IN_CART,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message:
          type === "course"
            ? CartSuccessMessage.COURSE_ADDED_IN_CART
            : CartSuccessMessage.LEARNING_PATH_ADDED_IN_CART,
        data: updatedCartData,
      });
    } catch (error) {
      console.error("addToCart error:", error);
      const type = req.body.type as "course" | "learningPath" | undefined;
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          type === "course"
            ? CartErrorMessage.FAILED_TO_ADD_COURSE_IN_CART
            : CartErrorMessage.FAILED_TO_ADD_LEARNING_PATH_IN_CART,
      });
    }
  }

  async removeFromCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const itemId = new Types.ObjectId(req.params.itemId);
      const type = req.query.type as "course" | "learningPath";

      if (!["course", "learningPath"].includes(type)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: CartErrorMessage.INVALID_ITEM_TYPE,
        });
        return;
      }

      const updatedCartData = await this._cartService.removeFromCart(userId, itemId, type);

      if (updatedCartData === null) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message:
            type === "course"
              ? CartErrorMessage.FAILED_TO_REMOVE_COURSE_FROM_CART
              : CartErrorMessage.FAILED_TO_REMOVE_LEARNING_PATH_FROM_CART,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message:
          type === "course"
            ? CartSuccessMessage.COURSE_REMOVED_FROM_CART
            : CartSuccessMessage.LEARNING_PATH_REMOVED_FROM_CART,
        data: updatedCartData,
      });
    } catch (error) {
      console.error("removeFromCart error:", error);
      const type = req.query.type as "course" | "learningPath" | undefined;
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          type === "course"
            ? CartErrorMessage.FAILED_TO_REMOVE_COURSE_FROM_CART
            : CartErrorMessage.FAILED_TO_REMOVE_LEARNING_PATH_FROM_CART,
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