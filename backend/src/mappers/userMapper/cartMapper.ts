import { ICart } from "../../models/cartModel";
import { CartCourseDTO } from "../../dto/userDTO/cartCourseDTO";
import { PopulatedCartCourse } from "../../types/PopulatedCartCourse";

export const mapCartToDTO = (cart: ICart): CartCourseDTO[] => {
  if (!cart?.courses) return [];

  return (cart.courses as unknown[])
    .filter(
      (course): course is PopulatedCartCourse =>
        typeof (course as PopulatedCartCourse).courseName === "string",
    )
    .map((course) => ({
      courseId: course._id.toString(),
      courseName: course.courseName,
      price: course.price,
      thumbnailUrl: course.thumbnailUrl,
    }));
};
