import { Types, SortOrder, PopulateOptions } from "mongoose";
import { ILearningPath, LearningPathModel } from "../../models/learningPathModel";
import { ICourseOffer } from "../../models/courseOfferModel";
import { IStudentLmsRepo } from "./interface/IStudentLmsRepo";
import { GenericRepository } from "../genericRepository";
import { IStudentCourseOfferRepository } from "./interface/IStudentCourseOfferRepo";

export class StudentLmsRepo extends GenericRepository<ILearningPath> implements IStudentLmsRepo {
  private _courseOfferRepo: IStudentCourseOfferRepository;

  constructor(courseOfferRepo: IStudentCourseOfferRepository) {
    super(LearningPathModel);
    this._courseOfferRepo = courseOfferRepo;
  }

  async getLearningPaths(
    query = "",
    page = 1,
    limit = 10,
    category?: string,
    sort: "name-asc" | "name-desc" | "price-asc" | "price-desc" = "name-asc"
  ): Promise<{ paths: ILearningPath[]; total: number; offers: Map<string, ICourseOffer> }> {
    const filter: any = {
      status: "accepted",
      isPublished: true,
    };

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = Types.ObjectId.isValid(category) ? new Types.ObjectId(category) : category;
    }

    const populate: PopulateOptions[] = [
      {
        path: "courses",
        select: "courseName thumbnailUrl price effectivePrice duration isPublished",
        match: { isPublished: true },
      },
      {
        path: "category",
        select: "categoryName",
      },
      {
        path: "instructor",
        select: "username",
        options: { strictPopulate: false },
      },
    ];

    const sortCriteria: Record<string, Record<string, SortOrder>> = {
      "name-asc": { title: 1 },
      "name-desc": { title: -1 },
      "price-asc": { totalPrice: 1 }, // Note: Sorting by totalPrice requires service-layer sorting
      "price-desc": { totalPrice: -1 },
    };

    const { data: paths, total } = await this.paginate(
      filter,
      page,
      limit,
      sortCriteria[sort] ?? { title: 1 },
      populate
    );

    // Fetch offers for all courses in the returned learning paths
    const courseIds = paths
      .flatMap(path => path.courses?.map(course => course._id.toString()) || [])
      .filter(id => id);
    const offers = await this._courseOfferRepo.findValidOffersByCourseIds(courseIds);
    
    // Create a map of courseId to offer for efficient lookup
    const offerMap = new Map<string, ICourseOffer>(
      offers.map(offer => [offer.courseId.toString(), offer])
    );

    return { paths, total, offers: offerMap };
  }

  async getLearningPathById(pathId: Types.ObjectId): Promise<{ path: ILearningPath | null; offers: Map<string, ICourseOffer> }> {
    const filter = {
      _id: pathId,
      status: "accepted",
      isPublished: true,
    };

    const populate: PopulateOptions[] = [
      {
        path: "courses",
        select: "courseName thumbnailUrl price effectivePrice duration isPublished",
        match: { isPublished: true },
      },
      {
        path: "category",
        select: "categoryName",
      },
      {
        path: "instructor",
        select: "username",
        options: { strictPopulate: false },
      },
    ];

    const learningPath = await this.findOne(filter, populate);
    if (!learningPath) {
      return { path: null, offers: new Map() };
    }

    learningPath.instructorName = learningPath.instructor?.username || "Unknown Instructor";

    // Fetch offers for the courses in this learning path
    const courseIds = learningPath.courses?.map(course => course._id.toString()) || [];
    const offers = await this._courseOfferRepo.findValidOffersByCourseIds(courseIds);
    const offerMap = new Map<string, ICourseOffer>(
      offers.map(offer => [offer.courseId.toString(), offer])
    );

    return { path: learningPath, offers: offerMap };
  }

  async getLearningPathsByIds(ids: Types.ObjectId[]): Promise<{ paths: ILearningPath[]; offers: Map<string, ICourseOffer> }> {
    const filter = {
      _id: { $in: ids },
      status: "accepted",
      isPublished: true,
    };

    const populate: PopulateOptions[] = [
      {
        path: "courses",
        select: "courseName thumbnailUrl price effectivePrice duration isPublished",
        match: { isPublished: true },
      },
      {
        path: "category",
        select: "categoryName",
      },
      {
        path: "instructor",
        select: "username",
        options: { strictPopulate: false },
      },
    ];

    const learningPaths = await this.findAll(filter, populate);

    // Fetch offers for all courses in the returned learning paths
    const courseIds = learningPaths
      .flatMap(path => path.courses?.map(course => course._id.toString()) || [])
      .filter(id => id);
    const offers = await this._courseOfferRepo.findValidOffersByCourseIds(courseIds);
    const offerMap = new Map<string, ICourseOffer>(
      offers.map(offer => [offer.courseId.toString(), offer])
    );

    for (const lp of learningPaths) {
      lp.instructorName = lp.instructor?.username || "Unknown Instructor";
    }

    return { paths: learningPaths, offers: offerMap };
  }
}