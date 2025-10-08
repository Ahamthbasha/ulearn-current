import { Types } from "mongoose";
import { ILearningPath } from "../../models/learningPathModel";
import { ICourse } from "../../models/courseModel";
import { LearningPathDetailDTO } from "../../dto/userDTO/userLearningPathDTO";

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

export async function mapToLearningPathDetailDTO(
  path: ILearningPath,
  getPresignedUrl: (key: string) => Promise<string>
): Promise<LearningPathDetailDTO> {
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

  // Use instructorName from populated instructor field
  const instructorName = path.instructorName || "Unknown Instructor";

  // Map courses to include courseId and courseName
  const courses = (path.courses || []).map((course: Partial<ICourse>) => ({
    courseId: course._id?.toString() || "",
    courseName: course.courseName || "Unknown Course",
  }));

  return {
    learningPathId: path._id.toString(),
    title: path.title,
    description: path.description || "",
    instructorId: path.instructorId.toString(),
    instructorName,
    noOfCourses: path.items?.length || path.courses?.length || 0,
    hoursOfCourses:
      path.courses?.reduce(
        (sum: number, course: Partial<ICourse>) =>
          sum + (parseFloat(course.duration || "0") || 0),
        0
      ) || 0,
    courses,
    learningPathThumbnailUrl: thumbnailUrl,
    categoryId,
    categoryName,
    totalPrice: path.totalPrice || 0,
  };
}