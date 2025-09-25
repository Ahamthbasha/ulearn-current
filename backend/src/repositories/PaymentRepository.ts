import { IPayment, PaymentModel } from "../models/paymentModel";
import { IPaymentRepository } from "./interfaces/IPaymentRepository";
import { GenericRepository } from "./genericRepository";

export class PaymentRepository
  extends GenericRepository<IPayment>
  implements IPaymentRepository
{
  constructor() {
    super(PaymentModel);
  }

  async findByOrderId(orderId: string): Promise<IPayment | null> {
    return this.model.findOne({ orderId }).exec();
  }

  async findByPaymentId(paymentId: string): Promise<IPayment | null> {
    return this.model.findOne({ paymentId }).exec();
  }
}
