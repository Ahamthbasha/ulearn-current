import { IPayment, PaymentModel } from "../models/paymentModel";
import { GenericRepository } from "./genericRepository";

export class PaymentRepository extends GenericRepository<IPayment> {
  constructor() {
    super(PaymentModel);
  }
}
