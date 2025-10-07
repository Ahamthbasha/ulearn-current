import { Types } from "mongoose";
import { ICourseOffer } from "../../models/courseOfferModel";
import { IInstructorCourseOfferRepo } from "../../repositories/instructorRepository/interface/IInstructorCourseofferRepo"; 
import { IInstructorCourseOfferService } from "./interface/IInstructorCourseOfferService";
import { ICourseRepository } from "../../repositories/interfaces/ICourseRepository";
import { CourseOfferListDTO,CourseOfferDetailDTO } from "../../dto/instructorDTO/courseOfferDTO";
import { CourseOfferMapper } from "../../mappers/instructorMapper/courseOfferMapper";

export class InstructorCourseOfferService implements IInstructorCourseOfferService {
  private _courseRepo: ICourseRepository;
  private _courseOfferRepo: IInstructorCourseOfferRepo;

  constructor(courseRepo: ICourseRepository, courseOfferRepo: IInstructorCourseOfferRepo) {
    this._courseRepo = courseRepo;
    this._courseOfferRepo = courseOfferRepo;
  }

  async createCourseOffer(
    instructorId: string,
    courseId: string,
    discountPercentage: number,
    startDate: Date,
    endDate: Date
  ): Promise<ICourseOffer> {
    if (discountPercentage < 0 || discountPercentage > 100) throw new Error("Discount must be 0-100");
    if (startDate >= endDate) throw new Error("Start date must be before end date");

    const course = await this._courseRepo.findById(courseId);
    if (!course) throw new Error("Course not found");
    if (course.instructorId.toString() !== instructorId) throw new Error("Unauthorized");

    const existingOffer = await this._courseOfferRepo.findOne({ courseId, instructorId, status: { $ne: "rejected" } });
    if (existingOffer) throw new Error("Active or pending offer exists");

    const offerData: Partial<ICourseOffer> = {
      courseId: new Types.ObjectId(courseId),
      instructorId: new Types.ObjectId(instructorId),
      discountPercentage,
      startDate,
      endDate,
      isActive: false,
      isVerified: false,
      status: "pending",
      reviews: "",
    };

    return this._courseOfferRepo.createOffer(offerData);
  }

  async editCourseOffer(
    instructorId: string,
    offerId: string,
    discountPercentage: number,
    startDate: Date,
    endDate: Date
  ): Promise<ICourseOffer> {
    if (discountPercentage < 0 || discountPercentage > 100) throw new Error("Discount must be 0-100");
    if (startDate >= endDate) throw new Error("Start date must be before end date");

    const existingOffer = await this._courseOfferRepo.findById(offerId);
    if (!existingOffer) throw new Error("Offer not found");
    if (existingOffer.instructorId.toString() !== instructorId) throw new Error("Unauthorized");
    if (existingOffer.status === "approved") throw new Error("Cannot edit approved offer");

    const updatedOffer = await this._courseOfferRepo.updateById(offerId, {
      discountPercentage,
      startDate,
      endDate,
      status: "pending",
      isVerified: false,
      reviews: "",
      isActive: false,
    });

    if (!updatedOffer) throw new Error("Update failed");
    return updatedOffer;
  }

  async resubmitOffer(
    instructorId: string,
    offerId: string,
    discountPercentage: number,
    startDate: Date,
    endDate: Date
  ): Promise<ICourseOffer> {
    const offer = await this._courseOfferRepo.findById(offerId);
    if (!offer) throw new Error("Offer not found");
    if (offer.status !== "rejected") throw new Error("Only rejected offers can be resubmitted");
    if (offer.instructorId.toString() !== instructorId) throw new Error("Unauthorized");

    const updatedOffer = await this.editCourseOffer(instructorId, offerId, discountPercentage, startDate, endDate);
    if (!updatedOffer) throw new Error("Resubmit failed");
    return updatedOffer;
  }

  async getOffersByInstructor(
    instructorId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<{ data: CourseOfferListDTO[]; total: number }> {
    const result = await this._courseOfferRepo.getOffersByInstructor(instructorId, page, limit, search);
    return {
      data: CourseOfferMapper.toCourseOfferListDTOs(result.data),
      total: result.total,
    };
  }

  async deleteCourseOffer(instructorId: string, offerId: string): Promise<void> {
    const deletedOffer = await this._courseOfferRepo.deleteById(offerId, instructorId);
    if (!deletedOffer) throw new Error("Delete failed or unauthorized");
  }

  async getInstructorCourseOfferById(offerId: string, instructorId: string): Promise<CourseOfferDetailDTO> {
    const offer = await this._courseOfferRepo.findById(offerId);
    if (!offer) throw new Error("Offer not found");
    if (offer.instructorId.toString() !== instructorId) throw new Error("Unauthorized");
    return CourseOfferMapper.toCourseOfferDetailDTO(offer);
  }
}
