import { Types } from "mongoose";
import { ILearningPath } from "../../models/learningPathModel";
import { ICourse } from "../../models/courseModel";
import { LearningPathListDTOUSER } from "../../dto/userDTO/userLearningPathDTO";
import { ICourseOffer } from "../../models/courseOfferModel";

interface ICategoryPopulated {
  _id: Types.ObjectId;
  categoryName: string;
}

function isCategoryPopulated(obj: unknown): obj is ICategoryPopulated {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "_id" in obj &&
    "categoryName" in obj
  );
}

export async function mapToLearningPathListDTOUSER(
  path: ILearningPath,
  getPresignedUrl: (key: string) => Promise<string>,
  offers: Map<string, ICourseOffer>,
): Promise<LearningPathListDTOUSER> {
  const thumbnailUrl = path.thumbnailUrl
    ? await getPresignedUrl(path.thumbnailUrl)
    : "";

  // Handle category
  let categoryId = "";
  let categoryName = "";
  if (path.category) {
    if (isCategoryPopulated(path.category)) {
      categoryId = path.category._id.toString();
      categoryName = path.category.categoryName;
    } else if (typeof path.category === "string") {
      try {
        const parsed = JSON.parse(path.category);
        categoryId = parsed._id
          ? new Types.ObjectId(parsed._id).toString()
          : path.category;
        categoryName = parsed.categoryName || "";
      } catch {
        categoryId = path.category;
        categoryName = "";
      }
    }
  }

  // Calculate totalPrice
  let totalPrice = 0;
  if (path.courses && path.courses.length > 0) {
    for (const course of path.courses) {
      if (!course._id || !course.isPublished) continue; // Skip unpublished or invalid courses

      const offer = offers.get(course._id.toString());
      if (offer && offer.isActive && offer.status === "approved") {
        totalPrice +=
          (course.price ?? 0) * (1 - offer.discountPercentage / 100);
      } else {
        totalPrice += course.effectivePrice ?? course.price ?? 0;
      }
    }
  }

  return {
    learningPathId: path._id.toString(),
    title: path.title,
    description: path.description || "",
    noOfCourses: path.courses?.length || path.items?.length || 0,
    hoursOfCourses:
      path.courses?.reduce(
        (sum: number, course: Partial<ICourse>) =>
          sum + (parseFloat(course.duration || "0") || 0),
        0,
      ) || 0,
    thumbnailUrl,
    totalPrice: totalPrice > 0 ? totalPrice : 0,
    categoryId,
    categoryName,
  };
}
