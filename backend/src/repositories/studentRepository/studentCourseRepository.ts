import { IStudentCourseRepository } from "./interface/IStudentCourseRepository";
import { ICourse, CourseModel } from "../../models/courseModel";
import { GenericRepository } from "../genericRepository";
import { IChapterReadOnlyRepository } from "../interfaces/IChapterReadOnlyRepository";
import { IQuizReadOnlyRepository } from "../interfaces/IQuizReadOnlyRepository";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { ICourseOffer } from "../../models/courseOfferModel";
import { IStudentCourseOfferRepository } from "./interface/IStudentCourseOfferRepo";
import { appLogger } from "../../utils/logger";

export class StudentCourseRepository
  extends GenericRepository<ICourse>
  implements IStudentCourseRepository
{
  private _chapterRepo: IChapterReadOnlyRepository;
  private _quizRepo: IQuizReadOnlyRepository;
  private _courseOfferRepo: IStudentCourseOfferRepository;

  constructor(
    chapterRepo: IChapterReadOnlyRepository,
    quizRepo: IQuizReadOnlyRepository,
    courseOfferRepo: IStudentCourseOfferRepository,
  ) {
    super(CourseModel);
    this._chapterRepo = chapterRepo;
    this._quizRepo = quizRepo;
    this._courseOfferRepo = courseOfferRepo;
  }

  async getAllListedCourses(): Promise<
    { course: ICourse; chapterCount: number; quizQuestionCount: number }[]
  > {
    const listedCourses = (await this.findAll(
      { isListed: true, isPublished: true },
      ["category", "instructorId"],
    )) as ICourse[];

    const courseIds = listedCourses.map((course) => course._id.toString());
    const offers =
      await this._courseOfferRepo.findValidOffersByCourseIds(courseIds);
    const offerMap = new Map<string, ICourseOffer>(
      offers.map((offer) => [offer.courseId.toString(), offer]),
    );

    const result = await Promise.all(
      listedCourses.map(async (course) => {
        const courseId = course._id.toString();
        const chapterCount =
          await this._chapterRepo.countChaptersByCourse(courseId);
        const quizQuestionCount =
          await this._quizRepo.countQuestionsByCourse(courseId);
        const signedThumbnailUrl = await getPresignedUrl(course.thumbnailUrl);

        const offer = offerMap.get(courseId);
        const discountedPrice =
          offer && offer.isActive && offer.status === "approved"
            ? course.price * (1 - offer.discountPercentage / 100)
            : undefined;

        appLogger.info(
          `getAllListedCourses ${courseId}: price=${course.price}, discountedPrice=${discountedPrice}`,
        );

        return {
          course: {
            ...course.toObject(),
            thumbnailUrl: signedThumbnailUrl,
            originalPrice: course.price,
            discountedPrice, // Add discountedPrice
          },
          chapterCount,
          quizQuestionCount,
        };
      }),
    );

    return result;
  }

  async getFilteredCourses(
    page: number,
    limit: number,
    searchTerm = "",
    sort: "name-asc" | "name-desc" | "price-asc" | "price-desc" = "name-asc",
    categoryId?: string,
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
      ["category", "instructorId"],
    );

    const courseIds = courses.map((course) => course._id.toString());
    const offers =
      await this._courseOfferRepo.findValidOffersByCourseIds(courseIds);
    const offerMap = new Map<string, ICourseOffer>(
      offers.map((offer) => [offer.courseId.toString(), offer]),
    );

    const result = await Promise.all(
      courses.map(async (course) => {
        const courseId = course._id.toString();
        const chapterCount =
          await this._chapterRepo.countChaptersByCourse(courseId);
        const quizQuestionCount =
          await this._quizRepo.countQuestionsByCourse(courseId);
        const signedThumbnailUrl = await getPresignedUrl(course.thumbnailUrl);

        const offer = offerMap.get(courseId);
        const discountedPrice =
          offer && offer.isActive && offer.status === "approved"
            ? course.price * (1 - offer.discountPercentage / 100)
            : undefined;

        appLogger.info(
          `getFilteredCourses ${courseId}: price=${course.price}, discountedPrice=${discountedPrice}`,
        );

        return {
          course: {
            ...course.toObject(),
            thumbnailUrl: signedThumbnailUrl,
            originalPrice: course.price,
            discountedPrice, // Add discountedPrice
          },
          chapterCount,
          quizQuestionCount,
        };
      }),
    );

    return { data: result, total };
  }

  async getCourseDetails(courseId: string): Promise<{
    course: ICourse | null;
    chapterCount: number;
    quizQuestionCount: number;
  }> {
    const course = await this.findByIdWithPopulate(courseId, [
      "category",
      "instructorId",
    ]);
    if (!course) return { course: null, chapterCount: 0, quizQuestionCount: 0 };

    const chapterCount =
      await this._chapterRepo.countChaptersByCourse(courseId);
    const quizQuestionCount =
      await this._quizRepo.countQuestionsByCourse(courseId);

    const signedThumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
    const signedDemoVideoUrl = await getPresignedUrl(course.demoVideo.url);

    const offer =
      await this._courseOfferRepo.findValidOfferByCourseId(courseId);
    const discountedPrice =
      offer && offer.isActive && offer.status === "approved"
        ? course.price * (1 - offer.discountPercentage / 100)
        : undefined;

    course.thumbnailUrl = signedThumbnailUrl;
    course.demoVideo.url = signedDemoVideoUrl;
    course.originalPrice = course.price;
    course.discountedPrice = discountedPrice;

    return { course, chapterCount, quizQuestionCount };
  }

  async getCourses(categoryId?:string): Promise<Array<{ _id: string; courseName: string }>> {
    
    const filter : any = {isListed:true,isPublished:true};
    if(categoryId){
      filter.category = categoryId
    }
    
    
    const listedCourses = (await this.findAll(
      filter,
      [], 
      { _id: 1, courseName: 1 } 
    )) as ICourse[];

    const result = listedCourses.map((course) => ({
      _id: course._id.toString(),
      courseName: course.courseName,
    }));
    return result;
  }
}
