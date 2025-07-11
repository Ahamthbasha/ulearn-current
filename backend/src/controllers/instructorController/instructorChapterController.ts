import { Request, Response, NextFunction } from "express";
import { IInstructorChapterController } from "./interfaces/IInstructorChapterController";
import { IInstructorChapterService } from "../../services/interface/IInstructorChapterService";
import { StatusCode } from "../../utils/enums";
import { uploadToS3Bucket } from "../../utils/s3Bucket";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { ChapterErrorMessages,ChapterSuccessMessages } from "../../utils/constants";

export class InstructorChapterController implements IInstructorChapterController {
    private chapterService: IInstructorChapterService
  constructor( chapterService: IInstructorChapterService) {
    this.chapterService = chapterService
  }

 async createChapter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { chapterTitle, chapterNumber, description, courseId } = req.body;

    const existing = await this.chapterService.findByTitleOrNumberAndCourseId(courseId, chapterTitle, Number(chapterNumber));
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
    const captionsFile = files["captions"]?.[0];

    if (!videoFile) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: ChapterErrorMessages.CHAPTER_REQUIRE_VIDEOFILE});
      return;
    }

    const videoUrl = await uploadToS3Bucket({
      originalname: videoFile.originalname,
      buffer: videoFile.buffer,
      mimetype: videoFile.mimetype
    }, "chapters/videos");

    let captionsUrl: string | undefined;
    if (captionsFile) {
      captionsUrl = await uploadToS3Bucket({
        originalname: captionsFile.originalname,
        buffer: captionsFile.buffer,
        mimetype: captionsFile.mimetype
      }, "chapters/captions");
    }

    const chapterDTO = {
      chapterTitle,
      chapterNumber: Number(chapterNumber),
      courseId,
      description,
      videoUrl,
      captionsUrl
    };

    const chapter = await this.chapterService.createChapter(chapterDTO);
    res.status(StatusCode.CREATED).json({ success: true,
      message:ChapterSuccessMessages.CHAPTER_CREATED,
      data: chapter });

  } catch (error) {
    next(error);
  }
}


  // async getChaptersByCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  //   try {
  //     const { courseId } = req.params;
  //     const chapters = await this.chapterService.getChaptersByCourse(courseId);

  //     console.log(chapters)
  //     res.status(StatusCode.OK).json({ 
  //       success: true,
  //        data: chapters,
  //       message: ChapterSuccessMessages.CHAPTER_RETRIEVED
  //       });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  async getChaptersByCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;

    const filter: any = {
      courseId,
      ...(search && {
        $or: [
          { chapterTitle: { $regex: search, $options: "i" } },
          { chapterNumber: isNaN(Number(search)) ? -1 : Number(search) }
        ],
      }),
    };

    const { data, total } = await this.chapterService.paginateChapters(filter, Number(page), Number(limit));

    res.status(StatusCode.OK).json({
      success: true,
      data,
      total,
      message: ChapterSuccessMessages.CHAPTER_RETRIEVED,
    });
  } catch (error) {
    next(error);
  }
}


  async updateChapter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { chapterId } = req.params;
    const { chapterTitle, chapterNumber, description } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    let videoUrl: string | undefined;
    let captionsUrl: string | undefined;

    const videoFile = files?.["video"]?.[0];
    const captionsFile = files?.["captions"]?.[0];

    if (videoFile) {
      videoUrl = await uploadToS3Bucket({
        originalname: videoFile.originalname,
        buffer: videoFile.buffer,
        mimetype: videoFile.mimetype,
      }, "chapters/videos");
    }

    if (captionsFile) {
      captionsUrl = await uploadToS3Bucket({
        originalname: captionsFile.originalname,
        buffer: captionsFile.buffer,
        mimetype: captionsFile.mimetype,
      }, "chapters/captions");
    }

    // ✅ 1. Check if another chapter with the same title (case-insensitive) exists in the course
    const existing = await this.chapterService.findByTitleOrNumberAndCourseId(req.body.courseId, chapterTitle, Number(chapterNumber));
if (existing && existing._id.toString() !== chapterId) {
  res.status(StatusCode.CONFLICT).json({
    success: false,
    message:
      existing.chapterTitle.toLowerCase() === chapterTitle.toLowerCase()
        ? ChapterErrorMessages.CHAPTER_ALREADY_EXIST
        : ChapterErrorMessages.CHAPTER_NUMBER_ALREADY_EXIST,
  });
  return;
}


    // ✅ 2. Proceed with update
    const updatedChapterData: any = {
      chapterTitle,
      chapterNumber: Number(chapterNumber),
      description,
    };

    if (videoUrl) updatedChapterData.videoUrl = videoUrl;
    if (captionsUrl) updatedChapterData.captionsUrl = captionsUrl;

    const updated = await this.chapterService.updateChapter(chapterId, updatedChapterData);

    if (!updated) {
      res.status(StatusCode.NOT_FOUND).json({ success: false, message: ChapterErrorMessages.CHAPTER_NOT_FOUND });
      return;
    }

    res.status(StatusCode.OK).json({ success: true, data: updated ,
      message:ChapterSuccessMessages.CHAPTER_UPDATED
    });
  } catch (error) {
    next(error);
  }
}


  async deleteChapter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chapterId } = req.params;
      const deleted = await this.chapterService.deleteChapter(chapterId);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: ChapterErrorMessages.CHAPTER_NOT_FOUND });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, message: ChapterSuccessMessages.CHAPTER_DELETED });
    } catch (error) {
      next(error);
    }
  }

async getChapterById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { chapterId } = req.params;
    const chapter = await this.chapterService.getChapterById(chapterId);

    if (!chapter) {
      res.status(StatusCode.NOT_FOUND).json({ success: false, message: ChapterSuccessMessages.CHAPTER_DELETED });
      return;
    }

    // Generate pre-signed URLs if files exist
    let videoPresignedUrl = null;
    let captionsPresignedUrl = null;

    if (chapter.videoUrl) {
      videoPresignedUrl = await getPresignedUrl(chapter.videoUrl);
    }

    if (chapter.captionsUrl) {
      captionsPresignedUrl = await getPresignedUrl(chapter.captionsUrl);
    }

    res.status(StatusCode.OK).json({
      success: true,
      data: {
        ...chapter.toObject(),
        videoPresignedUrl,
        captionsPresignedUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}
}
