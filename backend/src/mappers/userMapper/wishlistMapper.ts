import { IWishlist } from "../../models/wishlistModel";
import { ICourse } from "../../models/courseModel";
import { WishlistItemDTO } from "../../dto/userDTO/wishlistCourseDTO";
import { ILearningPath } from "../../models/learningPathModel";

export const mapWishlistToDTO = (
  wishlist: IWishlist[],
  courseDetailsMap: Map<string, { price: number; thumbnailUrl: string }>,
  learningPathDetailsMap: Map<string, { price: number; thumbnailUrl: string }>,
): WishlistItemDTO[] => {
  return wishlist
    .filter((item) => item.courseId || item.learningPathId)
    .map((item) => {
      if (item.courseId && (item.courseId as ICourse)._id) {
        const course = item.courseId as ICourse;
        const courseDetails = courseDetailsMap.get(course._id.toString());
        return {
          itemId: course._id.toString(),
          name: course.courseName || "Unknown Course",
          price:
            courseDetails?.price ?? course.effectivePrice ?? course.price ?? 0,
          thumbnailUrl:
            courseDetails?.thumbnailUrl ?? course.thumbnailUrl ?? "",
          type: "course" as const,
        };
      } else if (
        item.learningPathId &&
        (item.learningPathId as ILearningPath)._id
      ) {
        const learningPath = item.learningPathId as ILearningPath;
        const learningPathDetails = learningPathDetailsMap.get(
          learningPath._id.toString(),
        );
        return {
          itemId: learningPath._id.toString(),
          name: learningPath.title || "Unknown Learning Path",
          price: learningPathDetails?.price ?? learningPath.totalPrice ?? 0,
          thumbnailUrl:
            learningPathDetails?.thumbnailUrl ??
            learningPath.thumbnailUrl ??
            "",
          type: "learningPath" as const,
        };
      }
      return {
        itemId: "",
        name: "Invalid Item",
        price: 0,
        thumbnailUrl: "",
        type: item.courseId ? ("course" as const) : ("learningPath" as const),
      };
    })
    .filter((dto) => dto.itemId !== "");
};
