import { IGenericRepository } from "../genericRepository";
import { IPayment } from "../../models/paymentModel";

export interface IPaymentRepository extends IGenericRepository<IPayment>{
    
}