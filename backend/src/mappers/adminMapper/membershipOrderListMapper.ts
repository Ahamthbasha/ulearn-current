import { InstructorMembershipOrderDTO } from "../../models/instructorMembershipOrderModel";
import { AdminMembershipOrderListDTO } from "../../dto/adminDTO/membershipOrderListDTO";

export function mapMembershipOrderToListDTO(
  order: InstructorMembershipOrderDTO,
): AdminMembershipOrderListDTO {
  return {
    instructorName: order.instructor.name,
    orderId: order.razorpayOrderId,
    membershipName: order.membershipPlan.name,
    price: order.price,
    status: order.paymentStatus,
  };
}

export function mapMembershipOrdersToListDTO(
  orders: InstructorMembershipOrderDTO[],
): AdminMembershipOrderListDTO[] {
  return orders.map(mapMembershipOrderToListDTO);
}
