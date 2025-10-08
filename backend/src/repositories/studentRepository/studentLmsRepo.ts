import { Types } from "mongoose";
import { ILearningPath, LearningPathModel } from "../../models/learningPathModel" 
import { IStudentLmsRepo } from "./interface/IStudentLmsRepo"; 

export class StudentLmsRepo implements IStudentLmsRepo {
  async getLearningPaths(
    query = "",
    page = 1,
    limit = 10,
    category?: string
  ): Promise<{ paths: ILearningPath[]; total: number }> {
    const skip = (page - 1) * limit;
    const searchQuery = query
      ? { $or: [{ title: { $regex: query, $options: "i" } }, { description: { $regex: query, $options: "i" } }] }
      : {};

    const filter: any = {
      status: "accepted",
      isPublished: true,
      ...searchQuery,
    };

    if (category) {
      filter["category"] = category; 
    }

    const [paths, total] = await Promise.all([
      LearningPathModel.find(filter)
        .populate({
          path: "courses",
          select: "title thumbnailUrl effectivePrice duration",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LearningPathModel.countDocuments(filter),
    ]);

    return { paths, total };
  }

  async getLearningPathById(pathId: Types.ObjectId): Promise<ILearningPath | null> {
    return LearningPathModel.findOne({
      _id: pathId,
      status: "accepted",
      isPublished: true,
    })
      .populate({
        path: "courses",
        select: "title thumbnailUrl effectivePrice duration",
      })
      .lean();
  }
}