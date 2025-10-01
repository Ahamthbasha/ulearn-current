import { IOrder } from "../../models/orderModel";
import { OrderDetailsDTO } from "../../dto/userDTO/orderDetailsDTO";
import { IUser } from "../../models/userModel";
import { ICourse } from "../../models/courseModel";
import { ICoupon } from "../../models/couponModel";

export const toOrderDetailsDTO = (order: IOrder): OrderDetailsDTO => {
  const date = new Date(order.createdAt);
  const formattedDate = date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const user = order.userId as unknown as IUser;
  if (!user.username || !user.email) {
    throw new Error("Order userId is not populated with user details");
  }

  // Safely narrow courses
  const populatedCourses = order.courses as unknown as Array<
    ICourse & { price: number }
  >;

  const originalTotalAmount = populatedCourses.reduce(
    (sum, course) => sum + (course.price || 0),
    0,
  );

  const couponDiscountAmount =
    order.couponId && originalTotalAmount > order.amount
      ? originalTotalAmount - order.amount
      : 0;

  const coupon = order.couponId as unknown as ICoupon | undefined;

  return {
    customerName: user.username,
    customerEmail: user.email,
    payment: order.gateway,
    totalAmount: order.amount,
    status: order.status,
    orderId: order._id.toString(),
    orderDate: formattedDate,
    courses: populatedCourses.map((course) => ({
      courseName: course.courseName,
      price: course.price,
      thumbnailUrl: course.thumbnailUrl,
    })),
    totalAmountWithoutDiscount:originalTotalAmount,
    canRetryPayment: order.status === "FAILED",
    couponCode: coupon?.code,
    couponDiscountPercentage: coupon?.discount,
    couponDiscountAmount: couponDiscountAmount > 0 ? couponDiscountAmount : undefined,
  };
};