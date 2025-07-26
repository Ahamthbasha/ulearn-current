import { IAdminCourseRepository } from "../interfaces/IAdminCourseRepository";
import { ICourse, CourseModel } from "../../models/courseModel";
import { GenericRepository } from "../genericRepository";
import { ChapterDetailRepository } from "../ChapterRepository";
import { QuizDetailRepository } from "../QuizRepository";
import { IChapter } from "../../models/chapterModel";
import { IQuiz } from "../../models/quizModel";
import { getPresignedUrl } from "../../utils/getPresignedUrl";


export class AdminCourseRepository
  extends GenericRepository<ICourse>
  implements IAdminCourseRepository
  {
  private chapterDetailRepo : ChapterDetailRepository
  private quizDetailRepo : QuizDetailRepository
  constructor(chapterDetailRepo:ChapterDetailRepository,quizDetailRepo:QuizDetailRepository) {
    super(CourseModel);
    this.chapterDetailRepo = chapterDetailRepo
    this.quizDetailRepo = quizDetailRepo
  }

  async getAllCourses(
    search = "",
    page = 1,
    limit = 10
  ): Promise<{ data: ICourse[]; total: number }> {
    const filter = search
      ? { courseName: { $regex: search, $options: "i" } }
      : {};

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


  const chapters = await this.chapterDetailRepo.find({ courseId });

  for(const chapter of chapters){
    if(chapter.videoUrl){
      chapter.videoUrl = await getPresignedUrl(chapter.videoUrl)
    }

    if(chapter.captionsUrl){
      chapter.captionsUrl = await getPresignedUrl(chapter.captionsUrl)
    }
  }
  const quiz = await this.quizDetailRepo.findOne({ courseId });

  return { course, chapters, quiz };
}


  async toggleListingStatus(courseId: string): Promise<ICourse | null> {
    const course = await this.findById(courseId);
    if (!course) return null;

    return await this.update(courseId, { isListed: !course.isListed });
  }

  async toggleVerificationStatus(courseId: string): Promise<ICourse | null> {
  const course = await this.findById(courseId);
  if (!course) return null;

  const newVerificationStatus = !course.isVerified;
  const updatedCourse = await this.update(courseId, {
    isVerified: newVerificationStatus,
    isListed: newVerificationStatus, // only allow listing if verified
  });

  return updatedCourse;
}

}
