import { IOrder } from "../../models/orderModel";
import { OrderDetailsDTO } from "../../dto/userDTO/orderDetailsDTO";
import { IUser } from "../../models/userModel";
import { ICourse } from "../../models/courseModel";

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

  // Safely narrow userId
  const user = order.userId as unknown as IUser;
  if (!user.username || !user.email) {
    throw new Error("Order userId is not populated with user details");
  }

  // Safely narrow courses
  const populatedCourses = order.courses as unknown as Array<
    ICourse & { price: number }
  >;

  return {
    customerName: user.username,
    customerEmail: user.email,
    payment: order.gateway,
    totalAmount: order.amount,
    status: order.status,
    orderId: order._id.toString(),
    orderDate: formattedDate,
    courses: populatedCourses.map(course => ({
      courseName: course.courseName,
      price: course.price,
      thumbnailUrl:course.thumbnailUrl
    })),
  };
};
