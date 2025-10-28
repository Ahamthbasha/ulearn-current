import { Response } from "express";
import { Types } from "mongoose";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { IStudentWishlistService } from "../../services/studentServices/interface/IStudentWishlistService";
import { StatusCode } from "../../utils/enums";
import {
  WishlistSuccessMessage,
  WishlistErrorMessage,
  StudentErrorMessages,
} from "../../utils/constants";
import { IStudentWishlistController } from "./interfaces/IStudentWishlistController";
import { appLogger } from "../../utils/logger";

export class StudentWishlistController implements IStudentWishlistController {
  private _wishlistService: IStudentWishlistService;

  constructor(wishlistService: IStudentWishlistService) {
    this._wishlistService = wishlistService;
  }

  async addToWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const itemId = new Types.ObjectId(req.body.itemId);
      const type = req.body.type as "course" | "learningPath";

      if (!["course", "learningPath"].includes(type)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: WishlistErrorMessage.INVALID_ITEM_TYPE,
        });
        return;
      }

      const exists = await this._wishlistService.isItemInWishlist(
        userId,
        itemId,
        type,
      );
      if (exists) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          message:
            type === "course"
              ? WishlistErrorMessage.COURSE_ALREADY_IN_WISHLIST
              : WishlistErrorMessage.LEARNING_PATH_ALREADY_IN_WISHLIST,
        });
        return;
      }

      const result = await this._wishlistService.addToWishlist(
        userId,
        itemId,
        type,
      );
      res.status(StatusCode.CREATED).json({
        success: true,
        message:
          type === "course"
            ? WishlistSuccessMessage.COURSE_ADDED
            : WishlistSuccessMessage.LEARNING_PATH_ADDED,
        data: result,
      });
    } catch (error) {
      appLogger.error("addToWishlist error:", error);
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: StudentErrorMessages.TOKEN_INVALID,
      });
    }
  }

  async removeFromWishlist(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    let type: "course" | "learningPath" | undefined;
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const itemId = new Types.ObjectId(req.params.itemId);
      type = req.query.type as "course" | "learningPath";

      if (!["course", "learningPath"].includes(type)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: WishlistErrorMessage.INVALID_ITEM_TYPE,
        });
        return;
      }

      await this._wishlistService.removeFromWishlist(userId, itemId, type);
      res.status(StatusCode.OK).json({
        success: true,
        message:
          type === "course"
            ? WishlistSuccessMessage.COURSE_REMOVED
            : WishlistSuccessMessage.LEARNING_PATH_REMOVED,
      });
    } catch (error) {
      appLogger.error("removeFromWishlist error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          type === "course"
            ? WishlistErrorMessage.FAILED_TO_REMOVE_COURSE
            : type === "learningPath"
              ? WishlistErrorMessage.FAILED_TO_REMOVE_LEARNING_PATH
              : WishlistErrorMessage.FAILED_TO_CHECK_EXISTENCE,
      });
    }
  }

  async getWishlistItems(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const wishlistDTO = await this._wishlistService.getWishlistItems(userId);

      res.status(StatusCode.OK).json({
        success: true,
        message: WishlistSuccessMessage.ITEM_LIST_FETCHED,
        data: wishlistDTO,
      });
    } catch (error) {
      appLogger.error("getWishlistItems error:", error);
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: StudentErrorMessages.TOKEN_INVALID,
      });
    }
  }

  async isItemInWishlist(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    let type: "course" | "learningPath" | undefined;
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const itemId = new Types.ObjectId(req.params.itemId);
      type = req.query.type as "course" | "learningPath";

      if (!["course", "learningPath"].includes(type)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: WishlistErrorMessage.INVALID_ITEM_TYPE,
        });
        return;
      }

      const exists = await this._wishlistService.isItemInWishlist(
        userId,
        itemId,
        type,
      );
      res.status(StatusCode.OK).json({
        success: true,
        exists,
      });
    } catch (error) {
      appLogger.error("isItemInWishlist error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          type === "course"
            ? WishlistErrorMessage.FAILED_TO_CHECK_EXISTENCE
            : type === "learningPath"
              ? WishlistErrorMessage.FAILED_TO_CHECK_EXISTENCE
              : WishlistErrorMessage.INVALID_ITEM_TYPE,
      });
    }
  }
}
