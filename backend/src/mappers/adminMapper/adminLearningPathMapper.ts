import { ILearningPath } from "../../models/learningPathModel";
import { LearningPathDTO, PopulatedCourse } from "../../dto/adminDTO/learningPathDTO";
import { ICourseOffer } from "../../models/courseOfferModel";
import { formatDate } from "../../utils/dateFormat";
import { Types } from "mongoose";

interface ItemWithOffer {
  item: { courseId: any; order: number };
  offer: ICourseOffer | null;
}

export function mapLearningPathToDTO(learningPath: ILearningPath, itemsWithOffers?: ItemWithOffer[]): LearningPathDTO {
  const items = learningPath.items
    .filter((item) => item.courseId != null)
    .map((item, index) => {
      const course = item.courseId as PopulatedCourse;
      const offer = itemsWithOffers ? itemsWithOffers[index]?.offer : null;

      const effectivePrice = calculateEffectivePrice(course.price || 0, offer);

      return {
        courseId: course._id.toString(),
        order: item.order,
        courseName: course.courseName || undefined,
        thumbnailUrl: course.thumbnailUrl || undefined,
        price: effectivePrice,
        isVerified: course.isVerified ?? false,
      };
    });

  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

  const instructorId = learningPath.instructorId;
  let instructorName: string | undefined;
  let instructorEmail: string | undefined;
  if (instructorId && typeof instructorId === "object" && "username" in instructorId) {
    instructorName = (instructorId as any).username;
    instructorEmail = (instructorId as any).email;
  }

  const category = learningPath.categoryDetails || learningPath.category;

  return {
    _id: learningPath._id.toString(),
    title: learningPath.title,
    description: learningPath.description,
    instructorId: typeof instructorId === "string" ? instructorId : instructorId._id.toString(),
    instructorName,
    instructorEmail,
    items,
    totalPrice,
    isPublished: learningPath.isPublished,
    createdAt: formatDate(learningPath.createdAt),
    updatedAt: formatDate(learningPath.updatedAt),
    status: learningPath.status,
    adminReview: learningPath.adminReview,
    thumbnailUrl: learningPath.thumbnailUrl,
    categoryId: category instanceof Types.ObjectId ? category.toString() : category._id.toString(),
    categoryName: category instanceof Types.ObjectId ? undefined : category.categoryName,
  };
}

export function mapLearningPathsToDTO(learningPaths: ILearningPath[]): LearningPathDTO[] {
  return learningPaths.map((lp) => mapLearningPathToDTO(lp));
}

function calculateEffectivePrice(originalPrice: number, offer: ICourseOffer | null): number {
  if (!offer || !offer.isActive || offer.status !== "approved") return originalPrice;

  const now = new Date();
  const startDate = new Date(offer.startDate);
  const endDate = new Date(offer.endDate);

  if (now >= startDate && now <= endDate) {
    return originalPrice * (1 - offer.discountPercentage / 100);
  }
  return originalPrice;
}