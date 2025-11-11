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
import { IInstructorModuleService } from "../../services/instructorServices/interface/IInstructorModuleService";
import { IInstructorCourseService } from "../../services/instructorServices/interface/IInstructorCourseService";
import { syncDurations } from "../../utils/instructorUtilities/syncDuration";
import { IChapter } from "../../models/chapterModel";

export class InstructorChapterController
  implements IInstructorChapterController
{
  private _chapterService: IInstructorChapterService;
  private _moduleService: IInstructorModuleService;
  private _courseService: IInstructorCourseService
  constructor(chapterService: IInstructorChapterService,moduleService:IInstructorModuleService,courseService:IInstructorCourseService) {
    this._chapterService = chapterService;
    this._moduleService = moduleService;
    this._courseService = courseService;
  }

  async createChapter(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { chapterTitle, chapterNumber, description, moduleId ,duration} = req.body;
      const parsedDuration = parseInt(duration);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: "Invalid video duration",
      });
      return
    }


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
        moduleId,
        description,
        videoUrl,
        duration:parsedDuration
      };

      const chapter = await this._chapterService.createChapter(chapterDTO);

      await syncDurations(this._moduleService,this._courseService,moduleId)
      
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
    const { chapterTitle, chapterNumber, description, duration } = req.body as {
      chapterTitle?: string;
      chapterNumber?: string;
      description?: string;
      duration?: string; // ← From frontend
    };

    const originalChapter = await this._chapterService.getChapterById(chapterId);
    if (!originalChapter) {
      res.status(StatusCode.NOT_FOUND).json({
        success: false,
        message: ChapterErrorMessages.CHAPTER_NOT_FOUND,
      });
      return
    }

    const moduleId = originalChapter.moduleId.toString();

    // === 1. Validate title & number conflict ===
    if (chapterTitle || chapterNumber) {
      const titleToCheck = chapterTitle?.trim();
      const numberToCheck = chapterNumber ? Number(chapterNumber) : undefined;

      if (titleToCheck || (numberToCheck !== undefined && !isNaN(numberToCheck))) {
        const existing = await this._chapterService.findByTitleOrNumberAndModuleId(
          moduleId,
          titleToCheck ?? "",
          numberToCheck ?? 0,
          chapterId
        );

        if (existing) {
          const isTitleConflict = titleToCheck && existing.chapterTitle.toLowerCase() === titleToCheck.toLowerCase();
          const isNumberConflict = numberToCheck !== undefined && existing.chapterNumber === numberToCheck;

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
            return
          }
        }
      }
    }

    // === 2. Handle video upload & duration ===
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const videoFile = files?.["video"]?.[0];

    let videoUrl: string | undefined = originalChapter.videoUrl;
    let finalDuration: number = originalChapter.duration;

    if (videoFile) {
      // Upload new video
      videoUrl = await uploadToS3Bucket(
        {
          originalname: videoFile.originalname,
          buffer: videoFile.buffer,
          mimetype: videoFile.mimetype,
        },
        "chapters/videos"
      );

      // Use duration from frontend
      if (duration) {
        const parsed = parseInt(duration, 10);
        if (!isNaN(parsed) && parsed > 0) {
          finalDuration = parsed;
        } else {
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message: "Invalid duration provided",
          });
          return
        }
      } else {
        res.status(StatusCode.BAD_REQUEST).json({
          success:            false,
          message: "Duration is required when uploading new video",
        });
        return
      }
    }

    // === 3. Build update payload ===
    const updatedChapterData: Partial<IChapter> = {};

    if (chapterTitle !== undefined) updatedChapterData.chapterTitle = chapterTitle.trim();
    if (chapterNumber !== undefined) {
      const num = Number(chapterNumber);
      if (!isNaN(num)) updatedChapterData.chapterNumber = num;
    }
    if (description !== undefined) updatedChapterData.description = description;
    if (videoUrl !== originalChapter.videoUrl) updatedChapterData.videoUrl = videoUrl;
    if (finalDuration !== originalChapter.duration) updatedChapterData.duration = finalDuration;

    if (Object.keys(updatedChapterData).length === 0) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: "No valid fields provided to update",
      });
      return
    }

    // === 4. Save chapter ===
    const updated = await this._chapterService.updateChapter(chapterId, updatedChapterData);
    if (!updated) {
      res.status(StatusCode.NOT_FOUND).json({
        success: false,
        message: ChapterErrorMessages.CHAPTER_NOT_FOUND,
      });
      return
    }

    // === 5. Sync durations ===
    await syncDurations(this._moduleService, this._courseService, moduleId);

    // === 6. Respond ===
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

      // Fetch chapter to get moduleId before deletion
      const chapter = await this._chapterService.getChapterById(chapterId);
      if (!chapter) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ChapterErrorMessages.CHAPTER_NOT_FOUND,
        });
        return;
      }

      const moduleId = chapter.moduleId.toString();

      const deleted = await this._chapterService.deleteChapter(chapterId);

      await syncDurations(this._moduleService,this._courseService,moduleId)

      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ChapterErrorMessages.CHAPTER_NOT_FOUND,
        });
        return;
      }

      // Sync module duration after chapter deletion
      await this._moduleService.updateModuleDuration(moduleId);

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