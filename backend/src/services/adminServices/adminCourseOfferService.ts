import { Types } from "mongoose";
import { ICourse } from "../../models/courseModel";
import { ICourseOffer } from "../../models/courseOfferModel";
import { ICourseRepository } from "../../repositories/interfaces/ICourseRepository";
import { IAdminCourseOfferRepo } from "../../repositories/adminRepository/interface/IAdminCourseOfferRepo";
import { IAdminCourseOfferService } from "./interface/IAdminCourseOfferService";

export class AdminCourseOfferService implements IAdminCourseOfferService {
  private courseRepo: ICourseRepository;
  private courseOfferRepo: IAdminCourseOfferRepo;

  constructor(
    courseRepo: ICourseRepository,
    courseOfferRepo: IAdminCourseOfferRepo,
  ) {
    this.courseRepo = courseRepo;
    this.courseOfferRepo = courseOfferRepo;
  }

  async getPublishedCourses(): Promise<ICourse[]> {
    const filter = {
      isPublished: true,
      isListed: true,
      isVerified: true,
    };
    return this.courseRepo.find(filter, ["category", "instructorId"], { createdAt: -1 });
  }

  async createCourseOffer(
    courseId: string,
    discountPercentage: number,
    startDate: Date,
    endDate: Date,
  ): Promise<ICourseOffer> {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error("Discount percentage must be between 0 and 100");
    }
    if (startDate >= endDate) {
      throw new Error("Start date must be before end date");
    }

    const course = await this.courseRepo.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }
    if (!course.isPublished || !course.isListed || !course.isVerified) {
      throw new Error("Course must be published, listed, and verified for offers");
    }

    const existingOffer = await this.courseOfferRepo.findOne({ courseId });
    if (existingOffer) {
      throw new Error("Offer already exists for this course. Use edit to update.");
    }

    const offerData: Partial<ICourseOffer> = {
      courseId: new Types.ObjectId(courseId),
      discountPercentage,
      startDate,
      endDate,
      isActive: true,
    };
    const offer = await this.courseOfferRepo.create(offerData);

    await this.courseRepo.update(courseId, { offer: offer._id as Types.ObjectId });

    return offer;
  }

  async editCourseOffer(
    offerId: string,
    discountPercentage: number,
    startDate: Date,
    endDate: Date,
  ): Promise<ICourseOffer> {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error("Discount percentage must be between 0 and 100");
    }
    if (startDate >= endDate) {
      throw new Error("Start date must be before end date");
    }

    const existingOffer = await this.courseOfferRepo.findById(offerId);
    if (!existingOffer) {
      throw new Error("No offer found for this course offer ID.");
    }

    const updateData: Partial<ICourseOffer> = {
      discountPercentage,
      startDate,
      endDate,
    };
    const offer = await this.courseOfferRepo.updateById(offerId, updateData);
    if (!offer) {
      throw new Error("Failed to update course offer");
    }

    return offer;
  }

  async toggleCourseOfferActive(offerId: string): Promise<ICourseOffer> {
    const offer = await this.courseOfferRepo.toggleActiveById(offerId);
    if (!offer) {
      throw new Error("No offer found for this course offer ID");
    }

    if (!offer.isActive) {
      await this.courseRepo.removeOffer(offer.courseId.toString());
    }

    return offer;
  }

  async deleteCourseOffer(offerId: string): Promise<void> {
    const offer = await this.courseOfferRepo.deleteById(offerId);
    if (!offer) {
      throw new Error("No offer found for this course offer ID");
    }

    await this.courseRepo.removeOffer(offer.courseId.toString());
  }

  async getCourseOffers(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: ICourseOffer[]; total: number }> {
    if (page < 1 || limit < 1) {
      throw new Error("Page and limit must be positive integers");
    }

    return this.courseOfferRepo.getCourseOffers(page, limit, search);
  }

  async getCourseOfferById(offerId: string): Promise<ICourseOffer | null> {
    const offer = await this.courseOfferRepo.getCourseOfferById(offerId);
    if (!offer) {
      throw new Error("Course offer not found");
    }
    return offer;
  }
}