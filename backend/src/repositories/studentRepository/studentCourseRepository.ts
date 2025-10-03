import { IStudentCourseRepository } from "./interface/IStudentCourseRepository";
import { ICourse, CourseModel } from "../../models/courseModel";
import { GenericRepository } from "../genericRepository";
import { IChapterReadOnlyRepository } from "../interfaces/IChapterReadOnlyRepository";
import { IQuizReadOnlyRepository } from "../interfaces/IQuizReadOnlyRepository";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { ICourseOffer } from "../../models/courseOfferModel";
import { IStudentCourseOfferRepository } from "./interface/IStudentCourseOfferRepo"; 

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

    const result = await Promise.all(
      listedCourses.map(async (course) => {
        const courseId = course._id.toString();
        const chapterCount = await this._chapterRepo.countChaptersByCourse(courseId);
        const quizQuestionCount = await this._quizRepo.countQuestionsByCourse(courseId);
        const signedThumbnailUrl = await getPresignedUrl(course.thumbnailUrl);

        // Fetch and apply offer if valid
        const offer = await this._courseOfferRepo.findValidOfferByCourseId(courseId);
        const effectivePrice = this.calculateEffectivePrice(course.price, offer);

        return {
          course: {
            ...course.toObject(),
            thumbnailUrl: signedThumbnailUrl,
            price: effectivePrice,
            originalPrice: course.price, // Add original price for frontend display
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
    data: { course: ICourse; chapterCount: number; quizQuestionCount: number }[];
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

    const result = await Promise.all(
      courses.map(async (course) => {
        const chapterCount = await this._chapterRepo.countChaptersByCourse(
          course._id.toString(),
        );
        const quizQuestionCount = await this._quizRepo.countQuestionsByCourse(
          course._id.toString(),
        );
        const signedThumbnailUrl = await getPresignedUrl(course.thumbnailUrl);

        // Fetch and apply offer if valid
        const offer = await this._courseOfferRepo.findValidOfferByCourseId(course._id.toString());
        const effectivePrice = this.calculateEffectivePrice(course.price, offer);

        return {
          course: {
            ...course.toObject(),
            thumbnailUrl: signedThumbnailUrl,
            price: effectivePrice,
            originalPrice: course.price, // Add original price for frontend display
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

  const chapterCount = await this._chapterRepo.countChaptersByCourse(courseId);
  const quizQuestionCount = await this._quizRepo.countQuestionsByCourse(courseId);

  const signedThumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
  const signedDemoVideoUrl = await getPresignedUrl(course.demoVideo.url);

  // Fetch and apply offer if valid
  const offer = await this._courseOfferRepo.findValidOfferByCourseId(courseId);
  const effectivePrice = this.calculateEffectivePrice(course.price, offer);

  // Set originalPrice to the course's original price and price to the effective price
  course.thumbnailUrl = signedThumbnailUrl;
  course.demoVideo.url = signedDemoVideoUrl;
  course.originalPrice = course.price; // Set originalPrice to the original price
  course.price = effectivePrice; // Update price to the effective (discounted) price

  return { course, chapterCount, quizQuestionCount };
}

  private calculateEffectivePrice(originalPrice: number, offer: ICourseOffer | null): number {
    if (!offer || !offer.isActive) return originalPrice;

    const now = new Date(); // Use current system time dynamically
    const startDate = new Date(offer.startDate);
    const endDate = new Date(offer.endDate);

    if (now >= startDate && now <= endDate) {
      return originalPrice - (originalPrice * offer.discountPercentage / 100);
    }
    return originalPrice;
  }
}