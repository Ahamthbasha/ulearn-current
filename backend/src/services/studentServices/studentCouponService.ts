import { IStudentCouponRepo } from "../../repositories/studentRepository/interface/IStudentCouponRepo";
import { IStudentCouponService } from "./interface/IStudentCouponService";
import { ICoupon } from "../../models/couponModel";

export class StudentCouponService implements IStudentCouponService {
  private _couponRepo: IStudentCouponRepo;

  constructor(couponRepo: IStudentCouponRepo) {
    this._couponRepo = couponRepo;
  }

  async getAvailableCoupons(): Promise<ICoupon[]> {
    return await this._couponRepo.getAvailableCoupons();
  }
}
