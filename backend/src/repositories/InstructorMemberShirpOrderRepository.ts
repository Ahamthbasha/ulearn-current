import {
  IInstructorMembershipOrder,
  InstructorMembershipOrderModel,
} from "../models/instructorMembershipOrderModel";
import { GenericRepository } from "./genericRepository";

export class InstructorMembershipOrder extends GenericRepository<IInstructorMembershipOrder> {
  constructor() {
    super(InstructorMembershipOrderModel);
  }
}
