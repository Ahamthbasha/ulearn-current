import { ICourseOrderDetails, ICouponDetails } from "../../models/orderModel";
import { CourseInfoDTO, CouponInfoDTO, UserInfoDTO } from "../../dto/userDTO/courseInfoDTO";
import { getPresignedUrl } from "../../utils/getPresignedUrl";

export async function mapCourses(
  courses: ICourseOrderDetails[],
  includeThumbnail: boolean,
): Promise<CourseInfoDTO[]> {
  return await Promise.all(
    courses.map(async (course) => {
      const courseInfo: CourseInfoDTO = {
        courseId: course.courseId,
        courseName: course.courseName,
        courseOriginalPrice: course.coursePrice,
        courseOfferDiscount: course.courseOfferPercentage,
        courseOfferPrice: course.offerPrice ?? course.coursePrice,
      };

      if (includeThumbnail && course.thumbnailUrl) {
        try {
          courseInfo.thumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
        } catch (error) {
          console.error(
            `Failed to generate pre-signed URL for course ${course.courseId}:`,
            error,
          );
          courseInfo.thumbnailUrl = course.thumbnailUrl; // Fallback to original URL or handle differently
        }
      }

      return courseInfo;
    }),
  );
}

// Maps coupon details to CouponInfoDTO
export function mapCoupon(coupon: ICouponDetails): CouponInfoDTO {
  return {
    couponId: coupon.couponId,
    couponCode: coupon.couponName,
    couponDiscountPercentage: coupon.discountPercentage,
    discountAmount: coupon.discountAmount,
  };
}

// Maps user details to UserInfoDTO
export function mapUserInfo(user: any): UserInfoDTO {
  return {
    username: user.username,
    email: user.email,
  };
}