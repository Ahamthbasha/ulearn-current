import { ILearningPath } from "../../models/learningPathModel";
import { ICourse } from "../../models/courseModel";
import { LearningPathListDTOUSER } from "../../dto/userDTO/userLearningPathDTO";
import { Types } from "mongoose";

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

export function mapToLearningPathListDTOUSER(
  path: ILearningPath,
  getPresignedUrl: (key: string) => Promise<string>
): Promise<LearningPathListDTOUSER> {
  return new Promise(async (resolve) => {
    const thumbnailUrl = path.thumbnailUrl
      ? await getPresignedUrl(path.thumbnailUrl)
      : "";

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

    resolve({
      learningPathId: path._id.toString(),
      title: path.title,
      description: path.description || "",
      noOfCourses: path.items?.length || path.courses?.length || 0,
      hoursOfCourses:
        path.courses?.reduce(
          (sum: number, course: Partial<ICourse>) =>
            sum + (parseFloat(course.duration || "0") || 0),
          0
        ) || 0,
      thumbnailUrl,
      totalPrice: path.totalPrice || 0,
      categoryId,
      categoryName,
    });
  });
}
