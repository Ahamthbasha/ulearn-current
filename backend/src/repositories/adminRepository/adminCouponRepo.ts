import { FilterQuery, Types } from "mongoose";
import { CouponModel, ICoupon } from "../../models/couponModel";
import { IAdminCouponRepo } from "./interface/IAdminCouponRepo";
import { GenericRepository } from "../genericRepository";

export class AdminCouponRepo
  extends GenericRepository<ICoupon>
  implements IAdminCouponRepo
{
  constructor() {
    super(CouponModel);
  }

  async createCoupon(couponData: Partial<ICoupon>): Promise<ICoupon> {
    try {
      return await this.create(couponData);
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(`Failed to create coupon: ${errorMessage}`);
    }
  }

  async getAllCoupons(
    page: number,
    limit: number,
    searchCode?: string,
  ): Promise<{ coupons: ICoupon[]; total: number }> {
    try {
      let query: FilterQuery<ICoupon> = {};
      if (searchCode && searchCode.trim()) {
        query.code = {
          $regex: searchCode.trim(),
          $options: "i",
        };
      }

      const { data, total } = await this.paginate(query, page, limit, {
        createdAt: -1,
      });
      return { coupons: data, total };
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(`Failed to fetch coupons: ${errorMessage}`);
    }
  }

  async getCouponById(id: Types.ObjectId): Promise<ICoupon | null> {
    try {
      return await this.findById(id.toString());
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(`Failed to fetch coupon: ${errorMessage}`);
    }
  }

  async getCouponByCode(code: string): Promise<ICoupon | null> {
    try {
      return await this.findOne({ code });
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(`Failed to fetch coupon by code: ${errorMessage}`);
    }
  }

  async updateCoupon(
    id: Types.ObjectId,
    couponData: Partial<ICoupon>,
  ): Promise<ICoupon | null> {
    try {
      return await this.update(id.toString(), couponData);
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(`Failed to update coupon: ${errorMessage}`);
    }
  }

  async deleteCoupon(id: Types.ObjectId): Promise<boolean> {
    try {
      const result = await this.delete(id.toString());
      return !!result;
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(`Failed to delete coupon: ${errorMessage}`);
    }
  }

  async toggleCouponStatus(
    id: Types.ObjectId,
    status: boolean,
  ): Promise<ICoupon | null> {
    try {
      return await this.update(id.toString(), { status });
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(`Failed to toggle coupon status: ${errorMessage}`);
    }
  }
}
