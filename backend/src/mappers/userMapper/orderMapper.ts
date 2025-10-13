import { ICourseOrderDetails, ILearningPathOrderDetails, ICouponDetails } from "../../models/orderModel";
import { CourseInfoDTO, CouponInfoDTO, UserInfoDTO } from "../../dto/userDTO/courseInfoDTO";
import { LearningPathInfoDTO } from "../../dto/userDTO/orderDetailsDTO"; 
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
        isAlreadyEnrolled: course.isAlreadyEnrolled ?? false, // Include isAlreadyEnrolled
      };

      if (includeThumbnail && course.thumbnailUrl) {
        try {
          courseInfo.thumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
        } catch (error) {
          console.error(
            `Failed to generate pre-signed URL for course ${course.courseId}:`,
            error,
          );
          courseInfo.thumbnailUrl = course.thumbnailUrl; // Fallback to original URL
        }
      }

      return courseInfo;
    }),
  );
}

export async function mapLearningPaths(
  learningPaths: ILearningPathOrderDetails[],
  includeThumbnail: boolean,
): Promise<LearningPathInfoDTO[]> {
  return await Promise.all(
    learningPaths.map(async (learningPath) => {
      const coursesInfo = await mapCourses(learningPath.courses, includeThumbnail);

      const learningPathInfo: LearningPathInfoDTO = {
        learningPathId: learningPath.learningPathId,
        learningPathName: learningPath.learningPathName,
        totalOriginalPrice: learningPath.totalPrice,
        totalOfferDiscount: learningPath.offerPercentage,
        totalOfferPrice: learningPath.offerPrice ?? learningPath.totalPrice,
        courses: coursesInfo,
      };

      if (includeThumbnail && learningPath.thumbnailUrl) {
        try {
          learningPathInfo.thumbnailUrl = await getPresignedUrl(learningPath.thumbnailUrl);
        } catch (error) {
          console.error(
            `Failed to generate pre-signed URL for learning path ${learningPath.learningPathId}:`,
            error,
          );
          learningPathInfo.thumbnailUrl = learningPath.thumbnailUrl; // Fallback to original URL
        }
      }

      return learningPathInfo;
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