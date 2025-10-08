import { Types, SortOrder } from "mongoose";
import { ILearningPath, LearningPathModel } from "../../models/learningPathModel";
import { IStudentLmsRepo } from "./interface/IStudentLmsRepo";
import { GenericRepository } from "../genericRepository";
import { PopulateOptions } from "mongoose";

export class StudentLmsRepo extends GenericRepository<ILearningPath> implements IStudentLmsRepo {
  constructor() {
    super(LearningPathModel);
  }

  async getLearningPaths(
    query = "",
    page = 1,
    limit = 10,
    category?: string,
    sort: "name-asc" | "name-desc" | "price-asc" | "price-desc" = "name-asc"
  ): Promise<{ paths: ILearningPath[]; total: number }> {
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
      filter.category = category;
    }

    const populate: PopulateOptions[] = [
      {
        path: "courses",
        select: "courseName thumbnailUrl effectivePrice duration",
      },
      {
        path: "category",
        select: "categoryName",
      },
      {
        path: "instructor",
        select: "username",
        options: { strictPopulate: false }, // Allow population of virtual field
      },
    ];

    const sortCriteria: Record<string, Record<string, SortOrder>> = {
      "name-asc": { title: 1 },
      "name-desc": { title: -1 },
      "price-asc": { totalPrice: 1 },
      "price-desc": { totalPrice: -1 },
    };

    const { data, total } = await this.paginate(
      filter,
      page,
      limit,
      sortCriteria[sort] ?? { title: 1 },
      populate
    );
    return { paths: data, total };
  }

  async getLearningPathById(pathId: Types.ObjectId): Promise<ILearningPath | null> {
    const filter = {
      _id: pathId,
      status: "accepted",
      isPublished: true,
    };

    const populate: PopulateOptions[] = [
      {
        path: "courses",
        select: "courseName thumbnailUrl effectivePrice duration",
      },
      {
        path: "category",
        select: "categoryName",
      },
      {
        path: "instructor",
        select: "username",
        options: { strictPopulate: false }, // Allow population of virtual field
      },
    ];

    const learningPath = await this.findOne(filter, populate);
    if (learningPath) {
    
      learningPath.instructorName = learningPath.instructor?.username || "Unknown Instructor";
    }
    return learningPath;
  }
}