import { ICourse } from "../../models/courseModel";
import { ILearningPath } from "../../models/learningPathModel";
import { LearningPathListDTO, LearningPathDTO } from "../../dto/userDTO/learningPathDTO";
import { formatDate } from "../../utils/dateFormat";
import { Types } from "mongoose";
import { CourseOfferModel, ICourseOffer } from "../../models/courseOfferModel";

export function mapLearningPathToListDTO(
  learningPath: ILearningPath,
): LearningPathListDTO {
  return {
    learningPathId: learningPath._id.toString(),
    title: learningPath.title,
    thumbnailUrl: learningPath.thumbnailUrl,
  };
}

export function mapLearningPathsToListDTO(
  learningPaths: ILearningPath[],
): LearningPathListDTO[] {
  return learningPaths.map(mapLearningPathToListDTO);
}

export async function mapLearningPathToDTO(
  learningPath: ILearningPath,
): Promise<LearningPathDTO> {
  let totalPrice = await learningPath.totalPrice;

  const courseIds = learningPath.items.map((item) =>
    item.courseId instanceof Types.ObjectId
      ? item.courseId.toString()
      : (item.courseId as ICourse)._id.toString(),
  );
  const offers = await CourseOfferModel.find({
    courseId: { $in: courseIds.map((id) => new Types.ObjectId(id)) },
    isActive: true,
    isVerified: true,
    status: "approved",
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  }).lean();

  const offerMap = new Map<string, ICourseOffer>(
    offers.map((offer) => [offer.courseId.toString(), offer]),
  );

  const items = learningPath.items.map((item) => {
    const isItemPopulated =
      item.courseId &&
      item.courseId instanceof Object &&
      "_id" in item.courseId;
    const courseId = isItemPopulated
      ? (item.courseId as ICourse)._id.toString()
      : (item.courseId as Types.ObjectId).toString();
    const course = isItemPopulated ? (item.courseId as ICourse) : null;
    const offer = offerMap.get(courseId);

    return {
      courseId,
      order: item.order,
      courseName: isItemPopulated ? course!.courseName : undefined,
      thumbnailUrl: isItemPopulated ? course!.thumbnailUrl : undefined,
      price: isItemPopulated
        ? offer
          ? course!.price * (1 - offer.discountPercentage / 100)
          : (course!.effectivePrice ?? course!.price)
        : undefined,
    };
  });

  return {
    _id: learningPath._id.toString(),
    title: learningPath.title,
    description: learningPath.description,
    studentId: learningPath.studentId.toString(), // Changed from instructorId
    items,
    totalPrice,
    isPurchased: learningPath.isPurchased,
    createdAt: formatDate(learningPath.createdAt),
    updatedAt: formatDate(learningPath.updatedAt),
    thumbnailUrl: learningPath.thumbnailUrl,
    category: learningPath.category!.toString(),
    categoryName: learningPath.categoryDetails?.categoryName ?? "",
  };
}

export async function mapLearningPathsToDTO(
  learningPaths: ILearningPath[],
): Promise<LearningPathDTO[]> {
  return await Promise.all(learningPaths.map(mapLearningPathToDTO));
}