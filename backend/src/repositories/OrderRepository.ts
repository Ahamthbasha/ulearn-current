import { IOrder, OrderModel } from "../models/orderModel";
import { GenericRepository } from "./genericRepository";

export class OrderRepository extends GenericRepository<IOrder> {
  constructor() {
    super(OrderModel);
  }
}