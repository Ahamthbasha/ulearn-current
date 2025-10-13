import { WishlistItemDTO } from "../../dto/userDTO/wishlistCourseDTO";
import { mapWishlistToDTO } from "../../mappers/userMapper/wishlistMapper";
import { IStudentCourseRepository } from "../../repositories/studentRepository/interface/IStudentCourseRepository";
import { IStudentLmsRepo } from "../../repositories/studentRepository/interface/IStudentLmsRepo";
import { IStudentCourseOfferRepository } from "../../repositories/studentRepository/interface/IStudentCourseOfferRepo";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { Types } from "mongoose";
import { IStudentWishlistService } from "./interface/IStudentWishlistService";
import { IStudentWishlistRepository } from "../../repositories/studentRepository/interface/IStudentWishlistRepository";
import { IWishlist } from "../../models/wishlistModel";
import { ICourse } from "../../models/courseModel";
import { ILearningPath } from "../../models/learningPathModel";
import { ICourseOffer } from "../../models/courseOfferModel";

export class StudentWishlistService implements IStudentWishlistService {
  private _wishlistRepository: IStudentWishlistRepository;
  private _courseRepository: IStudentCourseRepository;
  private _lmsRepository: IStudentLmsRepo;
  private _courseOfferRepository: IStudentCourseOfferRepository;

  constructor(
    wishlistRepository: IStudentWishlistRepository,
    courseRepository: IStudentCourseRepository,
    lmsRepository: IStudentLmsRepo,
    courseOfferRepository: IStudentCourseOfferRepository
  ) {
    this._wishlistRepository = wishlistRepository;
    this._courseRepository = courseRepository;
    this._lmsRepository = lmsRepository;
    this._courseOfferRepository = courseOfferRepository;
  }

  async addToWishlist(userId: Types.ObjectId, itemId: Types.ObjectId, type: "course" | "learningPath"): Promise<IWishlist> {
    return this._wishlistRepository.addToWishlist(userId, itemId, type);
  }

  async removeFromWishlist(userId: Types.ObjectId, itemId: Types.ObjectId, type: "course" | "learningPath"): Promise<void> {
    return this._wishlistRepository.removeFromWishlist(userId, itemId, type);
  }

  async getWishlistItems(userId: Types.ObjectId): Promise<WishlistItemDTO[]> {
    const wishlist = await this._wishlistRepository.getWishlistItems(userId);

    // Fetch course details
    const courseIds = wishlist
      .filter((item) => item.courseId)
      .map((item) => (item.courseId instanceof Types.ObjectId ? item.courseId.toString() : (item.courseId as ICourse)._id.toString()));
    const courseDetailsPromises = courseIds.map((id) => this._courseRepository.getCourseDetails(id));
    const courseDetailsResults = await Promise.all(courseDetailsPromises);
    const courseDetailsMap = new Map<string, { price: number; thumbnailUrl: string }>();
    const allCourseIds = new Set<string>(courseIds); // Track all course IDs for offer fetching

    for (const details of courseDetailsResults) {
      if (details.course) {
        let thumbnailUrl = details.course.thumbnailUrl || "";
        if (thumbnailUrl && !thumbnailUrl.includes("AWSAccessKeyId")) {
          try {
            thumbnailUrl = await getPresignedUrl(thumbnailUrl);
          } catch (error) {
            console.error(`Failed to generate presigned URL for course ${details.course._id}:`, error);
          }
        }
        courseDetailsMap.set(details.course._id.toString(), {
          price: details.course.effectivePrice ?? details.course.price,
          thumbnailUrl,
        });
      }
    }

    // Fetch learning path details
    const learningPathIds = wishlist
      .filter((item) => item.learningPathId)
      .map((item) => (item.learningPathId instanceof Types.ObjectId ? item.learningPathId.toString() : (item.learningPathId as ILearningPath)._id.toString()));
    const learningPathDetailsMap = new Map<string, { price: number; thumbnailUrl: string }>();

    // Fetch learning paths and their course offers
    for (const id of learningPathIds) {
      const learningPathResult = await this._lmsRepository.getLearningPathById(new Types.ObjectId(id));
      if (learningPathResult.path) {
        let thumbnailUrl = learningPathResult.path.thumbnailUrl || "";
        if (thumbnailUrl && !thumbnailUrl.includes("AWSAccessKeyId")) {
          try {
            thumbnailUrl = await getPresignedUrl(thumbnailUrl);
          } catch (error) {
            console.error(`Failed to generate presigned URL for learning path ${id}:`, error);
          }
        }

        // Calculate totalPrice for the learning path
        const courseIds = learningPathResult.path.courses?.map(course => course._id.toString()) || [];
        courseIds.forEach(courseId => allCourseIds.add(courseId)); // Add to all course IDs for offer fetching

        // Fetch offers for the courses in this learning path
        const offers = await this._courseOfferRepository.findValidOffersByCourseIds(courseIds);
        const offerMap = new Map<string, ICourseOffer>(
          offers.map(offer => [offer.courseId.toString(), offer])
        );

        // Calculate totalPrice by summing course prices with applied offers
        let totalPrice = 0;
        for (const course of learningPathResult.path.courses || []) {
          const courseId = course._id.toString();
          const offer = offerMap.get(courseId);
          const price = offer
            ? course.price * (1 - offer.discountPercentage / 100)
            : course.effectivePrice ?? course.price;
          totalPrice += price;
        }

        learningPathDetailsMap.set(id, {
          price: totalPrice,
          thumbnailUrl,
        });
      }
    }

    return mapWishlistToDTO(wishlist, courseDetailsMap, learningPathDetailsMap);
  }

  async isItemInWishlist(userId: Types.ObjectId, itemId: Types.ObjectId, type: "course" | "learningPath"): Promise<boolean> {
    return this._wishlistRepository.isItemInWishlist(userId, itemId, type);
  }
}