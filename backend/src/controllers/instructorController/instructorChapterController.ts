// import { Request, Response, NextFunction } from "express";
// import { IInstructorChapterController } from "./interfaces/IInstructorChapterController";
// import { IInstructorChapterService } from "../../services/instructorServices/interface/IInstructorChapterService";
// import { StatusCode } from "../../utils/enums";
// import {  uploadToS3Bucket } from "../../utils/s3Bucket";
// import { getPresignedUrl } from "../../utils/getPresignedUrl";
// import {
//   ChapterErrorMessages,
//   ChapterSuccessMessages,
// } from "../../utils/constants";

// export class InstructorChapterController
//   implements IInstructorChapterController
// {
//   private _chapterService: IInstructorChapterService;
//   constructor(chapterService: IInstructorChapterService) {
//     this._chapterService = chapterService;
//   }

//   async createChapter(
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ): Promise<void> {
//     try {
//       const { chapterTitle, chapterNumber, description, courseId } = req.body;

//       const existing =
//         await this._chapterService.findByTitleOrNumberAndCourseId(
//           courseId,
//           chapterTitle,
//           Number(chapterNumber),
//         );
//       if (existing) {
//         res.status(StatusCode.CONFLICT).json({
//           success: false,
//           message:
//             existing.chapterTitle.toLowerCase() === chapterTitle.toLowerCase()
//               ? ChapterErrorMessages.CHAPTER_ALREADY_EXIST
//               : ChapterErrorMessages.CHAPTER_NUMBER_ALREADY_EXIST,
//         });
//         return;
//       }

//       const files = req.files as { [fieldname: string]: Express.Multer.File[] };

//       const videoFile = files["video"]?.[0];

//       if (!videoFile) {
//         res.status(StatusCode.BAD_REQUEST).json({
//           success: false,
//           message: ChapterErrorMessages.CHAPTER_REQUIRE_VIDEOFILE,
//         });
//         return;
//       }

//       const videoUrl = await uploadToS3Bucket(
//         {
//           originalname: videoFile.originalname,
//           buffer: videoFile.buffer,
//           mimetype: videoFile.mimetype,
//         },
//         "chapters/videos",
//       );

//       const chapterDTO = {
//         chapterTitle,
//         chapterNumber: Number(chapterNumber),
//         courseId,
//         description,
//         videoUrl,
//       };

//       const chapter = await this._chapterService.createChapter(chapterDTO);
//       res.status(StatusCode.CREATED).json({
//         success: true,
//         message: ChapterSuccessMessages.CHAPTER_CREATED,
//         data: chapter,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async getChaptersByCourse(
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ): Promise<void> {
//     try {
//       const { courseId } = req.params;
//       const { page = "1", limit = "10", search = "" } = req.query;

//       const pageNum = parseInt(page as string, 10);
//       const limitNum = parseInt(limit as string, 10);

//       const filter: Record<string, unknown> = {
//         courseId,
//       };

//       if (search) {
//         const searchNum = Number(search);
//         filter.$or = [
//           { chapterTitle: { $regex: search as string, $options: "i" } },
//           { chapterNumber: isNaN(searchNum) ? -1 : searchNum },
//         ];
//       }

//       const result = await this._chapterService.paginateChapters(
//         filter,
//         pageNum,
//         limitNum,
//       );

//       res.status(StatusCode.OK).json({
//         success: true,
//         data: result.data,
//         total: result.total,
//         message: ChapterSuccessMessages.CHAPTER_RETRIEVED,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

// async updateChapter(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const { chapterId } = req.params;
//     const { chapterTitle, chapterNumber, description } = req.body as {
//       chapterTitle?: string;
//       chapterNumber?: string;
//       description?: string;
//     };

//     const originalChapter = await this._chapterService.getChapterById(chapterId);
//     if (!originalChapter) {
//       res.status(StatusCode.NOT_FOUND).json({
//         success: false,
//         message: ChapterErrorMessages.CHAPTER_NOT_FOUND,
//       });
//       return;
//     }

//     const courseId = originalChapter.courseId.toString();

//     // Only check for conflicts if title or number is being updated
//     if (chapterTitle || chapterNumber) {
//       const titleToCheck = chapterTitle?.trim();
//       const numberToCheck = chapterNumber ? Number(chapterNumber) : undefined;

//       // Skip if both are missing or invalid
//       if (titleToCheck || (numberToCheck !== undefined && !isNaN(numberToCheck))) {
//         const existing = await this._chapterService.findByTitleOrNumberAndCourseId(
//           courseId,
//           titleToCheck ?? "", // safe: only called if titleToCheck exists or number is valid
//           numberToCheck ?? 0, // safe fallback
//           chapterId,
//         );

//         if (existing) {
//           const isTitleConflict =
//             titleToCheck &&
//             existing.chapterTitle.toLowerCase() === titleToCheck.toLowerCase();
//           const isNumberConflict =
//             numberToCheck !== undefined &&
//             existing.chapterNumber === numberToCheck;

//           let errorMessage = "";
//           if (isTitleConflict && isNumberConflict) {
//             errorMessage = "Chapter title and number already exist";
//           } else if (isTitleConflict) {
//             errorMessage = ChapterErrorMessages.CHAPTER_ALREADY_EXIST;
//           } else if (isNumberConflict) {
//             errorMessage = ChapterErrorMessages.CHAPTER_NUMBER_ALREADY_EXIST;
//           }

//           if (errorMessage) {
//             res.status(StatusCode.CONFLICT).json({
//               success: false,
//               message: errorMessage,
//             });
//             return;
//           }
//         }
//       }
//     }

//     // Handle file upload
//     const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
//     const videoFile = files?.["video"]?.[0];
//     let videoUrl: string | undefined;

//     if (videoFile) {
//       videoUrl = await uploadToS3Bucket(
//         {
//           originalname: videoFile.originalname,
//           buffer: videoFile.buffer,
//           mimetype: videoFile.mimetype,
//         },
//         "chapters/videos",
//       );
//     }

//     // Build update payload
//     const updatedChapterData: Partial<{
//       chapterTitle: string;
//       chapterNumber: number;
//       description: string | undefined;
//       videoUrl: string;
//     }> = {};

//     if (chapterTitle !== undefined) updatedChapterData.chapterTitle = chapterTitle.trim();
//     if (chapterNumber !== undefined) {
//       const num = Number(chapterNumber);
//       if (!isNaN(num)) updatedChapterData.chapterNumber = num;
//     }
//     if (description !== undefined) updatedChapterData.description = description;
//     if (videoUrl) updatedChapterData.videoUrl = videoUrl;

//     // Only update if there's something to update
//     if (Object.keys(updatedChapterData).length === 0) {
//       res.status(StatusCode.BAD_REQUEST).json({
//         success: false,
//         message: "No valid fields provided to update",
//       });
//       return;
//     }

//     const updated = await this._chapterService.updateChapter(
//       chapterId,
//       updatedChapterData,
//     );

//     if (!updated) {
//       res.status(StatusCode.NOT_FOUND).json({
//         success: false,
//         message: ChapterErrorMessages.CHAPTER_NOT_FOUND,
//       });
//       return;
//     }

//     res.status(StatusCode.OK).json({
//       success: true,
//       data: updated,
//       message: ChapterSuccessMessages.CHAPTER_UPDATED,
//     });
//   } catch (error) {
//     next(error);
//   }
// }

//   async deleteChapter(
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ): Promise<void> {
//     try {
//       const { chapterId } = req.params;
//       const deleted = await this._chapterService.deleteChapter(chapterId);
//       if (!deleted) {
//         res.status(StatusCode.NOT_FOUND).json({
//           success: false,
//           message: ChapterErrorMessages.CHAPTER_NOT_FOUND,
//         });
//         return;
//       }
//       res.status(StatusCode.OK).json({
//         success: true,
//         message: ChapterSuccessMessages.CHAPTER_DELETED,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async getChapterById(
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ): Promise<void> {
//     try {
//       const { chapterId } = req.params;
//       const chapter = await this._chapterService.getChapterById(chapterId);

//       if (!chapter) {
//         res.status(StatusCode.NOT_FOUND).json({
//           success: false,
//           message: ChapterSuccessMessages.CHAPTER_DELETED,
//         });
//         return;
//       }

//       // Generate pre-signed URLs if files exist
//       let videoPresignedUrl = null;

//       if (chapter.videoUrl) {
//         videoPresignedUrl = await getPresignedUrl(chapter.videoUrl);
//       }

//       res.status(StatusCode.OK).json({
//         success: true,
//         data: {
//           ...chapter.toObject(),
//           videoPresignedUrl,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// }



































import { Request, Response, NextFunction } from "express";
import { IInstructorChapterController } from "./interfaces/IInstructorChapterController";
import { IInstructorChapterService } from "../../services/instructorServices/interface/IInstructorChapterService";
import { StatusCode } from "../../utils/enums";
import { uploadToS3Bucket } from "../../utils/s3Bucket";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import {
  ChapterErrorMessages,
  ChapterSuccessMessages,
} from "../../utils/constants";

export class InstructorChapterController
  implements IInstructorChapterController
{
  private _chapterService: IInstructorChapterService;
  
  constructor(chapterService: IInstructorChapterService) {
    this._chapterService = chapterService;
  }

  async createChapter(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { chapterTitle, chapterNumber, description, moduleId } = req.body; // Changed from courseId

      const existing =
        await this._chapterService.findByTitleOrNumberAndModuleId(
          moduleId, // Changed
          chapterTitle,
          Number(chapterNumber)
        );
      
      if (existing) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          message:
            existing.chapterTitle.toLowerCase() === chapterTitle.toLowerCase()
              ? ChapterErrorMessages.CHAPTER_ALREADY_EXIST
              : ChapterErrorMessages.CHAPTER_NUMBER_ALREADY_EXIST,
        });
        return;
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const videoFile = files["video"]?.[0];

      if (!videoFile) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: ChapterErrorMessages.CHAPTER_REQUIRE_VIDEOFILE,
        });
        return;
      }

      const videoUrl = await uploadToS3Bucket(
        {
          originalname: videoFile.originalname,
          buffer: videoFile.buffer,
          mimetype: videoFile.mimetype,
        },
        "chapters/videos"
      );

      const chapterDTO = {
        chapterTitle,
        chapterNumber: Number(chapterNumber),
        moduleId, // Changed from courseId
        description,
        videoUrl,
      };

      const chapter = await this._chapterService.createChapter(chapterDTO);
      
      res.status(StatusCode.CREATED).json({
        success: true,
        message: ChapterSuccessMessages.CHAPTER_CREATED,
        data: chapter,
      });
    } catch (error) {
      next(error);
    }
  }

  async getChaptersByModule(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { moduleId } = req.params; // Changed from courseId
      const { page = "1", limit = "10", search = "" } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const filter: Record<string, unknown> = {
        moduleId, // Changed from courseId
      };

      if (search) {
        const searchNum = Number(search);
        filter.$or = [
          { chapterTitle: { $regex: search as string, $options: "i" } },
          { chapterNumber: isNaN(searchNum) ? -1 : searchNum },
        ];
      }

      const result = await this._chapterService.paginateChapters(
        filter,
        pageNum,
        limitNum
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result.data,
        total: result.total,
        message: ChapterSuccessMessages.CHAPTER_RETRIEVED,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateChapter(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { chapterId } = req.params;
      const { chapterTitle, chapterNumber, description } = req.body as {
        chapterTitle?: string;
        chapterNumber?: string;
        description?: string;
      };

      const originalChapter = await this._chapterService.getChapterById(chapterId);
      
      if (!originalChapter) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ChapterErrorMessages.CHAPTER_NOT_FOUND,
        });
        return;
      }

      const moduleId = originalChapter.moduleId.toString(); // Changed from courseId

      // Only check for conflicts if title or number is being updated
      if (chapterTitle || chapterNumber) {
        const titleToCheck = chapterTitle?.trim();
        const numberToCheck = chapterNumber ? Number(chapterNumber) : undefined;

        if (titleToCheck || (numberToCheck !== undefined && !isNaN(numberToCheck))) {
          const existing = await this._chapterService.findByTitleOrNumberAndModuleId(
            moduleId, // Changed
            titleToCheck ?? "",
            numberToCheck ?? 0,
            chapterId
          );

          if (existing) {
            const isTitleConflict =
              titleToCheck &&
              existing.chapterTitle.toLowerCase() === titleToCheck.toLowerCase();
            const isNumberConflict =
              numberToCheck !== undefined &&
              existing.chapterNumber === numberToCheck;

            let errorMessage = "";
            if (isTitleConflict && isNumberConflict) {
              errorMessage = "Chapter title and number already exist";
            } else if (isTitleConflict) {
              errorMessage = ChapterErrorMessages.CHAPTER_ALREADY_EXIST;
            } else if (isNumberConflict) {
              errorMessage = ChapterErrorMessages.CHAPTER_NUMBER_ALREADY_EXIST;
            }

            if (errorMessage) {
              res.status(StatusCode.CONFLICT).json({
                success: false,
                message: errorMessage,
              });
              return;
            }
          }
        }
      }

      // Handle file upload
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const videoFile = files?.["video"]?.[0];
      let videoUrl: string | undefined;

      if (videoFile) {
        videoUrl = await uploadToS3Bucket(
          {
            originalname: videoFile.originalname,
            buffer: videoFile.buffer,
            mimetype: videoFile.mimetype,
          },
          "chapters/videos"
        );
      }

      // Build update payload
      const updatedChapterData: Partial<{
        chapterTitle: string;
        chapterNumber: number;
        description: string | undefined;
        videoUrl: string;
      }> = {};

      if (chapterTitle !== undefined) updatedChapterData.chapterTitle = chapterTitle.trim();
      if (chapterNumber !== undefined) {
        const num = Number(chapterNumber);
        if (!isNaN(num)) updatedChapterData.chapterNumber = num;
      }
      if (description !== undefined) updatedChapterData.description = description;
      if (videoUrl) updatedChapterData.videoUrl = videoUrl;

      // Only update if there's something to update
      if (Object.keys(updatedChapterData).length === 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "No valid fields provided to update",
        });
        return;
      }

      const updated = await this._chapterService.updateChapter(
        chapterId,
        updatedChapterData
      );

      if (!updated) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ChapterErrorMessages.CHAPTER_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: updated,
        message: ChapterSuccessMessages.CHAPTER_UPDATED,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteChapter(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { chapterId } = req.params;
      const deleted = await this._chapterService.deleteChapter(chapterId);
      
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ChapterErrorMessages.CHAPTER_NOT_FOUND,
        });
        return;
      }
      
      res.status(StatusCode.OK).json({
        success: true,
        message: ChapterSuccessMessages.CHAPTER_DELETED,
      });
    } catch (error) {
      next(error);
    }
  }

  async getChapterById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { chapterId } = req.params;
      const chapter = await this._chapterService.getChapterById(chapterId);

      if (!chapter) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ChapterErrorMessages.CHAPTER_NOT_FOUND, // Fixed: was using success message
        });
        return;
      }

      // Generate pre-signed URLs if files exist
      let videoPresignedUrl = null;

      if (chapter.videoUrl) {
        videoPresignedUrl = await getPresignedUrl(chapter.videoUrl);
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          ...chapter.toObject(),
          videoPresignedUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async reorderChapters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { moduleId } = req.params;
      const { orderedIds } = req.body as { orderedIds: string[] };

      if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: ChapterErrorMessages.CHAPTER_INVALID_ORDERIDS,
        });
        return;
      }

      const result = await this._chapterService.reorderChapters(moduleId, orderedIds);

      res.status(StatusCode.OK).json({
        success: true,
        message: ChapterSuccessMessages.CHAPTER_REORDERED,
        data: result.data,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }
}