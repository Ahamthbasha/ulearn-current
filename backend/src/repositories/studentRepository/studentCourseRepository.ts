import { IStudentCourseRepository } from "../interfaces/IStudentCourseRepository";
import { ICourse, CourseModel } from "../../models/courseModel";
import { GenericRepository } from "../genericRepository";
import { IChapterReadOnlyRepository } from "../interfaces/IChapterReadOnlyRepository";
import { IQuizReadOnlyRepository } from "../interfaces/IQuizReadOnlyRepository";
import { getPresignedUrl } from "../../utils/getPresignedUrl";


export class StudentCourseRepository
  extends GenericRepository<ICourse>
  implements IStudentCourseRepository
{
  private chapterRepo: IChapterReadOnlyRepository;
  private quizRepo: IQuizReadOnlyRepository;

  constructor(
    chapterRepo: IChapterReadOnlyRepository,
    quizRepo: IQuizReadOnlyRepository
  ) {
    super(CourseModel);
    this.chapterRepo = chapterRepo;
    this.quizRepo = quizRepo;
  }

  async getAllListedCourses(): Promise<
    { course: ICourse; chapterCount: number; quizQuestionCount: number }[]
  > {
    const listedCourses = (await this.findAll(
      { isListed: true, isPublished: true },
      ["category", "instructorId"]
    )) as ICourse[];

    const result = await Promise.all(
      listedCourses.map(async (course) => {
        const courseId = course._id.toString();
        const chapterCount = await this.chapterRepo.countChaptersByCourse(courseId);
        const quizQuestionCount = await this.quizRepo.countQuestionsByCourse(courseId);

        const signedThumbnailUrl = await getPresignedUrl(course.thumbnailUrl);

        return {
          course: {
            ...course.toObject(),
            thumbnailUrl: signedThumbnailUrl,
          },
          chapterCount,
          quizQuestionCount,
        };
      })
    );

    return result;
  }

async getFilteredCourses(
  page: number,
  limit: number,
  searchTerm = "",
  sort: "name-asc" | "name-desc" | "price-asc" | "price-desc" = "name-asc",
  categoryId?: string
): Promise<{
  data: {
    course: ICourse;
    chapterCount: number;
    quizQuestionCount: number;
  }[];
  total: number;
}> {
  const filter: any = {
    isListed: true,
    isPublished: true,
  };

  if (searchTerm) {
    filter.$or = [
      { courseName: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
    ];
  }

  if (categoryId) {
    filter.category = categoryId;
  }

  let sortOption: any = { createdAt: -1 };
  switch (sort) {
    case "name-asc":
      sortOption = { courseName: 1 };
      break;
    case "name-desc":
      sortOption = { courseName: -1 };
      break;
    case "price-asc":
      sortOption = { price: 1 };
      break;
    case "price-desc":
      sortOption = { price: -1 };
      break;
  }

  const { data: courses, total } = await this.paginate(
    filter,
    page,
    limit,
    sortOption,
    ["category", "instructorId"]
  );

  const result = await Promise.all(
    courses.map(async (course) => {
      const chapterCount = await this.chapterRepo.countChaptersByCourse(course._id.toString());
      const quizQuestionCount = await this.quizRepo.countQuestionsByCourse(course._id.toString());
      const signedThumbnailUrl = await getPresignedUrl(course.thumbnailUrl);

      return {
        course: {
          ...course.toObject(),
          thumbnailUrl: signedThumbnailUrl,
        },
        chapterCount,
        quizQuestionCount,
      };
    })
  );

  return { data: result, total };
}


async getCourseDetails(courseId: string): Promise<{
    course: ICourse | null;
    chapterCount: number;
    quizQuestionCount: number;
  }> {
    const course = await this.findByIdWithPopulate(courseId, ["category", "instructorId"]);
    if (!course) return { course: null, chapterCount: 0, quizQuestionCount: 0 };

    const chapterCount = await this.chapterRepo.countChaptersByCourse(courseId);
    const quizQuestionCount = await this.quizRepo.countQuestionsByCourse(courseId);

    const signedThumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
    const signedDemoVideoUrl = await getPresignedUrl(course.demoVideo.url);

    course.thumbnailUrl = signedThumbnailUrl;
    course.demoVideo.url = signedDemoVideoUrl;

    return { course, chapterCount, quizQuestionCount };
  }
}
