import {
  ICourseOrderDetails,
  ILearningPathOrderDetails,
  ICouponDetails,
} from "../../models/orderModel";
import {
  CourseInfoDTO,
  CouponInfoDTO,
  UserInfoDTO,
  UserDTO,
} from "../../dto/userDTO/courseInfoDTO";
import { LearningPathInfoDTO } from "../../dto/userDTO/orderDetailsDTO";

export function mapCourses(
  courses: ICourseOrderDetails[],
  includeThumbnail: boolean,
): CourseInfoDTO[] {
  return courses.map((course) => {
    const courseInfo: CourseInfoDTO = {
      courseId: course.courseId,
      courseName: course.courseName,
      courseOriginalPrice: course.coursePrice,
      courseOfferDiscount: course.courseOfferPercentage,
      courseOfferPrice: course.offerPrice ?? course.coursePrice,
      isAlreadyEnrolled: course.isAlreadyEnrolled ?? false,
    };

    if (includeThumbnail && course.thumbnailUrl) {
      courseInfo.thumbnailUrl = course.thumbnailUrl; // Direct Cloudinary URL
    }

    return courseInfo;
  });
}

export function mapLearningPaths(
  learningPaths: ILearningPathOrderDetails[],
  includeThumbnail: boolean,
): LearningPathInfoDTO[] {
  return learningPaths.map((learningPath) => {
    const coursesInfo = mapCourses(learningPath.courses, includeThumbnail);

    const learningPathInfo: LearningPathInfoDTO = {
      learningPathId: learningPath.learningPathId,
      learningPathName: learningPath.learningPathName,
      totalOriginalPrice: learningPath.totalPrice,
      totalOfferDiscount: learningPath.offerPercentage,
      totalOfferPrice: learningPath.offerPrice ?? learningPath.totalPrice,
      courses: coursesInfo,
    };

    if (includeThumbnail && learningPath.thumbnailUrl) {
      learningPathInfo.thumbnailUrl = learningPath.thumbnailUrl; // Direct Cloudinary URL
    }

    return learningPathInfo;
  });
}

export function mapCoupon(coupon: ICouponDetails): CouponInfoDTO {
  return {
    couponId: coupon.couponId,
    couponCode: coupon.couponName,
    couponDiscountPercentage: coupon.discountPercentage,
    discountAmount: coupon.discountAmount,
  };
}

export function mapUserInfo(user: UserDTO): UserInfoDTO {
  return {
    username: user.username,
    email: user.email,
  };
}
