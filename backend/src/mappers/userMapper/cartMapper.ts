import { Types } from "mongoose";
import { ICart } from "../../models/cartModel";
import { CartItemDTO } from "../../dto/userDTO/cartCourseDTO";
import { IEnrollment } from "../../models/enrollmentModel"; // Adjust path as needed

export const mapCartToDTO = (
  cart: ICart,
  courseDetailsMap: Map<string, { price: number; thumbnailUrl: string }>,
  learningPathDetailsMap: Map<string, { price: number; thumbnailUrl: string }>,
  enrolledCourseIds: IEnrollment[] | null = null,
): CartItemDTO[] => {
  const cartItems: CartItemDTO[] = [];

  const enrolledCourseIdSet = new Set(
    enrolledCourseIds ? enrolledCourseIds.map((e) => e.courseId.toString()) : []
  );

  if (Array.isArray(cart.courses)) {
    cart.courses.forEach((course) => {
      const courseId =
        course instanceof Types.ObjectId
          ? course.toString()
          : course._id.toString();
      const details = courseDetailsMap.get(courseId);
      if (details) {
        cartItems.push({
          itemId: courseId,
          type: "course",
          title: course instanceof Types.ObjectId ? "" : course.courseName || "Untitled Course",
          price: details.price,
          thumbnailUrl: details.thumbnailUrl,
          isAlreadyEnrolled: enrolledCourseIdSet.has(courseId),
        });
      }
    });
  }

  // Map learning paths
  if (Array.isArray(cart.learningPaths)) {
    cart.learningPaths.forEach((lp) => {
      const lpId =
        lp instanceof Types.ObjectId
          ? lp.toString()
          : lp._id.toString();
      const details = learningPathDetailsMap.get(lpId);
      if (details) {
        cartItems.push({
          itemId: lpId,
          type: "learningPath",
          title: lp instanceof Types.ObjectId ? "Loading..." : lp.title || "Untitled Learning Path",
          price: details.price,
          thumbnailUrl: details.thumbnailUrl,
          enrolledCourses: Array.from(enrolledCourseIdSet),
        });
      } 
    });
  }

  return cartItems;
};