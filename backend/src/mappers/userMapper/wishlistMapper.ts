import { IWishlist } from "../../models/wishlistModel";
import { WishlistCourseDTO } from "../../dto/userDTO/wishlistCourseDTO"; 
import { ICourse } from "../../models/courseModel";

export const mapWishlistToDTO = (wishlist: IWishlist[]): WishlistCourseDTO[] => {
  return wishlist.map((item) => {
    const course = item.courseId as ICourse;
    return {
      courseId: course._id.toString(),
      courseName: course.courseName,
      price: course.price,
      thumbnailUrl: course.thumbnailUrl || "",
    };
  });
};
