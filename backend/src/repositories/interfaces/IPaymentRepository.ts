// import { IGenericRepository } from "../genericRepository";
// import { IPayment } from "../../models/paymentModel";

// export interface IPaymentRepository extends IGenericRepository<IPayment> {}














































import { IGenericRepository } from "../genericRepository";
import { IPayment } from "../../models/paymentModel";

export interface IPaymentRepository extends IGenericRepository<IPayment> {
  findByOrderId(orderId: string): Promise<IPayment | null>;
  findByPaymentId(paymentId: string): Promise<IPayment | null>;
}