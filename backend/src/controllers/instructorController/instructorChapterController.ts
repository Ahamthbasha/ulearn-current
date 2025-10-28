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
    next: NextFunction,
  ): Promise<void> {
    try {
      const { chapterTitle, chapterNumber, description, courseId } = req.body;

      const existing =
        await this._chapterService.findByTitleOrNumberAndCourseId(
          courseId,
          chapterTitle,
          Number(chapterNumber),
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
        "chapters/videos",
      );

      const chapterDTO = {
        chapterTitle,
        chapterNumber: Number(chapterNumber),
        courseId,
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

  async getChaptersByCourse(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { courseId } = req.params;
      const { page = 1, limit = 10, search = "" } = req.query;

      const filter: any = {
        courseId,
        ...(search && {
          $or: [
            { chapterTitle: { $regex: search, $options: "i" } },
            { chapterNumber: isNaN(Number(search)) ? -1 : Number(search) },
          ],
        }),
      };

      const result = await this._chapterService.paginateChapters(
        filter,
        Number(page),
        Number(limit),
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
    next: NextFunction,
  ): Promise<void> {
    try {
      const { chapterId } = req.params;
      const { chapterTitle, chapterNumber, description } = req.body;

      const originalChapter =
        await this._chapterService.getChapterById(chapterId);
      if (!originalChapter) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ChapterErrorMessages.CHAPTER_NOT_FOUND,
        });
        return;
      }

      const courseId = originalChapter.courseId.toString();

      const existing =
        await this._chapterService.findByTitleOrNumberAndCourseId(
          courseId,
          chapterTitle,
          Number(chapterNumber),
          chapterId,
        );

      if (existing) {
        const isTitleConflict =
          existing.chapterTitle.toLowerCase() === chapterTitle.toLowerCase();
        const isNumberConflict =
          existing.chapterNumber === Number(chapterNumber);

        let errorMessage = "";
        if (isTitleConflict && isNumberConflict) {
          errorMessage = "Chapter title and number already exist";
        } else if (isTitleConflict) {
          errorMessage = ChapterErrorMessages.CHAPTER_ALREADY_EXIST;
        } else if (isNumberConflict) {
          errorMessage = ChapterErrorMessages.CHAPTER_NUMBER_ALREADY_EXIST;
        }

        res.status(StatusCode.CONFLICT).json({
          success: false,
          message: errorMessage,
        });
        return;
      }

      // Step 3: Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let videoUrl: string | undefined;

      const videoFile = files?.["video"]?.[0];

      if (videoFile) {
        videoUrl = await uploadToS3Bucket(
          {
            originalname: videoFile.originalname,
            buffer: videoFile.buffer,
            mimetype: videoFile.mimetype,
          },
          "chapters/videos",
        );
      }

      // Step 4: Update chapter
      const updatedChapterData: any = {
        chapterTitle,
        chapterNumber: Number(chapterNumber),
        description,
      };
      if (videoUrl) updatedChapterData.videoUrl = videoUrl;

      const updated = await this._chapterService.updateChapter(
        chapterId,
        updatedChapterData,
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
    next: NextFunction,
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
    next: NextFunction,
  ): Promise<void> {
    try {
      const { chapterId } = req.params;
      const chapter = await this._chapterService.getChapterById(chapterId);

      if (!chapter) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ChapterSuccessMessages.CHAPTER_DELETED,
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
}
