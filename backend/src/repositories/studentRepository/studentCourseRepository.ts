import { IStudentCourseRepository } from "./interface/IStudentCourseRepository";
import { ICourse, CourseModel } from "../../models/courseModel";
import { GenericRepository } from "../genericRepository";
import { IChapterReadOnlyRepository } from "../interfaces/IChapterReadOnlyRepository";
import { IQuizReadOnlyRepository } from "../interfaces/IQuizReadOnlyRepository";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { ICourseOffer } from "../../models/courseOfferModel";
import { IStudentCourseOfferRepository } from "./interface/IStudentCourseOfferRepo";
import { appLogger } from "../../utils/logger";
import { FilterQuery, SortOrder } from "mongoose";

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
    const filter: FilterQuery<ICourse> = {
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

    const isPriceSorting = sort === "price-asc" || sort === "price-desc";

    let sortOption: Record<string, SortOrder> = { createdAt: -1 };
    if (!isPriceSorting) {
      switch (sort) {
        case "name-asc":
          sortOption = { courseName: 1 };
          break;
        case "name-desc":
          sortOption = { courseName: -1 };
          break;
      }
    }

    const total = await this.countDocuments(filter);

    if (isPriceSorting) {
      const allCourses = (await this.findAll(
        filter,
        ["category", "instructorId"],
      )) as ICourse[];

      const courseIds = allCourses.map((course) => course._id.toString());
      const offers =
        await this._courseOfferRepo.findValidOffersByCourseIds(courseIds);
      const offerMap = new Map<string, ICourseOffer>(
        offers.map((offer) => [offer.courseId.toString(), offer]),
      );

      const coursesWithEffectivePrice = allCourses.map((course) => {
        const courseId = course._id.toString();
        const offer = offerMap.get(courseId);
        const effectivePrice =
          offer && offer.isActive && offer.status === "approved"
            ? course.price * (1 - offer.discountPercentage / 100)
            : course.price;

        return {
          course,
          effectivePrice,
        };
      });

      coursesWithEffectivePrice.sort((a, b) => {
        if (sort === "price-asc") {
          return a.effectivePrice - b.effectivePrice;
        } else {
          return b.effectivePrice - a.effectivePrice;
        }
      });

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCourses = coursesWithEffectivePrice.slice(
        startIndex,
        endIndex,
      );

      const result = await Promise.all(
        paginatedCourses.map(async ({ course, effectivePrice }) => {
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
            `getFilteredCourses ${courseId}: price=${course.price}, effectivePrice=${effectivePrice}, discountedPrice=${discountedPrice}`,
          );

          return {
            course: {
              ...course.toObject(),
              thumbnailUrl: signedThumbnailUrl,
              originalPrice: course.price,
              discountedPrice,
            },
            chapterCount,
            quizQuestionCount,
          };
        }),
      );

      return { data: result, total };
    }

    const { data: courses } = await this.paginate(
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
            discountedPrice,
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
    
    const filter : FilterQuery<ICourse> = {isListed:true,isPublished:true};
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
