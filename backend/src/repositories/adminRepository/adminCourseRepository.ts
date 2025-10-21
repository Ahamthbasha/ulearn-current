import { IAdminCourseRepository } from "./interface/IAdminCourseRepository";
import { ICourse, CourseModel } from "../../models/courseModel";
import { GenericRepository } from "../genericRepository";
import { ChapterDetailRepository } from "../ChapterRepository";
import { QuizDetailRepository } from "../QuizRepository";
import { IChapter } from "../../models/chapterModel";
import { IQuiz } from "../../models/quizModel";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { FilterQuery } from "mongoose";
export class AdminCourseRepository
  extends GenericRepository<ICourse>
  implements IAdminCourseRepository
{
  private _chapterDetailRepo: ChapterDetailRepository;
  private _quizDetailRepo: QuizDetailRepository;
  constructor(
    chapterDetailRepo: ChapterDetailRepository,
    quizDetailRepo: QuizDetailRepository,
  ) {
    super(CourseModel);
    this._chapterDetailRepo = chapterDetailRepo;
    this._quizDetailRepo = quizDetailRepo;
  }

  async getAllCourses(
    search = "",
    page = 1,
    limit = 10,
  ): Promise<{ data: ICourse[]; total: number }> {
    const filter: FilterQuery<ICourse> = { isSubmitted: true }; // Only show submitted courses

    if (search) {
      filter.courseName = { $regex: search, $options: "i" };
    }

    return await this.paginate(filter, page, limit, { createdAt: -1 });
  }

  async getCourseDetails(courseId: string): Promise<{
    course: ICourse | null;
    chapters: IChapter[];
    quiz: IQuiz | null;
  }> {
    const course = await this.findById(courseId);
    if (!course) return { course: null, chapters: [], quiz: null };

    if (course.demoVideo?.url) {
      course.demoVideo.url = await getPresignedUrl(course.demoVideo.url);
    }

    if (course.thumbnailUrl) {
      course.thumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
    }

    const chapters = await this._chapterDetailRepo.find({ courseId });

    for (const chapter of chapters) {
      if (chapter.videoUrl) {
        chapter.videoUrl = await getPresignedUrl(chapter.videoUrl);
      }
    }
    const quiz = await this._quizDetailRepo.findOne({ courseId });

    return { course, chapters, quiz };
  }

  async toggleListingStatus(courseId: string): Promise<ICourse | null> {
    const course = await this.findById(courseId);
    if (!course) return null;

    return await this.update(courseId, { isListed: !course.isListed });
  }

   async verifyCourse(courseId: string, status: "approved" | "rejected", review?: string): Promise<ICourse | null> {
    const course = await this.findById(courseId);
    if (!course) return null;

    const updateData: Partial<ICourse> = {
      isVerified: status === "approved",
      isListed: status === "approved",
      review: status === "rejected" ? review || "" : "",
      isSubmitted: status === "rejected" ? false : course.isSubmitted, // Reset isSubmitted on rejection
    };

    return await this.update(courseId, updateData);
  }
}
