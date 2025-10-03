import { ICart } from "../../models/cartModel";
import { CartCourseDTO } from "../../dto/userDTO/cartCourseDTO";
import { PopulatedCartCourse } from "../../types/PopulatedCartCourse";

export const mapCartToDTO = (cart: ICart, courseDetailsMap?: Map<string, { price: number; thumbnailUrl: string }>): CartCourseDTO[] => {
  if (!cart?.courses) return [];

  return (cart.courses as unknown[])
    .filter(
      (course): course is PopulatedCartCourse =>
        typeof (course as PopulatedCartCourse).courseName === "string",
    )
    .map((course) => {
      const courseId = course._id.toString();
      const details = courseDetailsMap?.get(courseId) || {
        price: course.price,
        thumbnailUrl: course.thumbnailUrl,
      };
      return {
        courseId,
        courseName: course.courseName,
        price: details.price,
        thumbnailUrl: details.thumbnailUrl,
      };
    });
};