import { Types } from "mongoose";
import { ICart } from "../../models/cartModel";
import { IStudentCartService } from "./interface/IStudentCartService";
import { IStudentCartRepository } from "../../repositories/studentRepository/interface/IStudentCartRepository";
import { CartItemDTO } from "../../dto/userDTO/cartCourseDTO";
import { mapCartToDTO } from "../../mappers/userMapper/cartMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { IStudentCourseRepository } from "../../repositories/studentRepository/interface/IStudentCourseRepository";
import { IStudentLmsRepo } from "../../repositories/studentRepository/interface/IStudentLmsRepo";
import { ILearningPath } from "../../models/learningPathModel";
import { ICourseOffer } from "../../models/courseOfferModel";
import { IStudentCourseOfferRepository } from "../../repositories/studentRepository/interface/IStudentCourseOfferRepo"; 
import { IEnrollmentRepository } from "../../repositories/interfaces/IEnrollmentRepository";

export class StudentCartService implements IStudentCartService {
  private _cartRepository: IStudentCartRepository;
  private _courseRepository: IStudentCourseRepository;
  private _lmsRepository: IStudentLmsRepo;
  private _courseOfferRepository: IStudentCourseOfferRepository;
  private _enrollmentRepository : IEnrollmentRepository;

  constructor(
    cartRepository: IStudentCartRepository,
    courseRepository: IStudentCourseRepository,
    lmsRepository: IStudentLmsRepo,
    courseOfferRepository: IStudentCourseOfferRepository,
    enrollmentRepository: IEnrollmentRepository
  ) {
    this._cartRepository = cartRepository;
    this._courseRepository = courseRepository;
    this._lmsRepository = lmsRepository;
    this._courseOfferRepository = courseOfferRepository;
    this._enrollmentRepository = enrollmentRepository
  }

async getCart(userId: Types.ObjectId): Promise<CartItemDTO[] | null> {
    const cart = await this._cartRepository.findCartByUserId(userId);
    if (!cart) return null;

    // Fetch enrolled course IDs
    const enrolledCourseIds = await this._enrollmentRepository.findAll({ userId });
    // Handle null case by defaulting to empty array
    const enrolledCourseIdSet = new Set(
      enrolledCourseIds ? enrolledCourseIds.map((e) => e.courseId.toString()) : []
    );

    // Collect all course IDs (from cart courses and learning paths)
    const courseIds = Array.isArray(cart.courses)
      ? cart.courses
          .map((course) =>
            course instanceof Types.ObjectId
              ? course.toString()
              : "courseName" in course && course._id
              ? course._id.toString()
              : null
          )
          .filter((id): id is string => id !== null)
      : [];

    const learningPathIds = Array.isArray(cart.learningPaths)
      ? cart.learningPaths
          .map((lp) =>
            lp instanceof Types.ObjectId
              ? lp.toString()
              : "title" in lp && lp._id
              ? lp._id.toString()
              : null
          )
          .filter((id): id is string => id !== null)
      : [];

    // Fetch learning paths to get their course IDs
    const allCourseIds = new Set<string>(courseIds);
    let learningPathDetailsMap = new Map<string, { price: number; thumbnailUrl: string }>();

    if (learningPathIds.length > 0) {
      const learningPathsResult = await this._lmsRepository.getLearningPathsByIds(
        learningPathIds.map((id) => new Types.ObjectId(id))
      );
      const learningPaths: ILearningPath[] = learningPathsResult.paths;

      for (const lp of learningPaths) {
        const lpCourseIds = lp.items
          .map((item) =>
            item.courseId instanceof Types.ObjectId
              ? item.courseId.toString()
              : item.courseId._id.toString()
          );
        lpCourseIds.forEach((id) => allCourseIds.add(id));
      }
    }

    // Fetch course details and offers for all course IDs
    const courseDetailsPromises = Array.from(allCourseIds).map((id) => this._courseRepository.getCourseDetails(id));
    const courseDetailsResults = await Promise.all(courseDetailsPromises);
    const courseDetailsMap = new Map<string, { price: number; thumbnailUrl: string }>();

    // Fetch offers for all courses
    const offers = await this._courseOfferRepository.findValidOffersByCourseIds(Array.from(allCourseIds));
    const offerMap = new Map<string, ICourseOffer>(
      offers.map((offer) => [offer.courseId.toString(), offer])
    );

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
        const courseId = details.course._id.toString();
        const offer = offerMap.get(courseId);
        const basePrice = details.course.price;
        const price = offer && offer.isActive && offer.status === "approved"
          ? basePrice * (1 - offer.discountPercentage / 100)
          : basePrice;
        courseDetailsMap.set(courseId, {
          price: enrolledCourseIdSet.has(courseId) ? 0 : price,
          thumbnailUrl,
        });
      }
    }

    // Calculate learning path details
    if (learningPathIds.length > 0) {
      const learningPathsResult = await this._lmsRepository.getLearningPathsByIds(
        learningPathIds.map((id) => new Types.ObjectId(id))
      );
      const learningPaths: ILearningPath[] = learningPathsResult.paths;

      for (const lp of learningPaths) {
        let thumbnailUrl = lp.thumbnailUrl || "";
        if (thumbnailUrl && !thumbnailUrl.includes("AWSAccessKeyId")) {
          try {
            thumbnailUrl = await getPresignedUrl(thumbnailUrl);
          } catch (error) {
            console.error(`Failed to generate presigned URL for learning path ${lp._id}:`, error);
          }
        }

        // Calculate total price using courseDetailsMap
        const lpCourseIds = lp.items
          .map((item) =>
            item.courseId instanceof Types.ObjectId
              ? item.courseId.toString()
              : item.courseId._id.toString()
          );
        let totalPrice = 0;
        for (const courseId of lpCourseIds) {
          const courseDetails = courseDetailsMap.get(courseId);
          if (courseDetails) {
            totalPrice += courseDetails.price;
          }
        }

        learningPathDetailsMap.set(lp._id.toString(), {
          price: totalPrice,
          thumbnailUrl,
        });
      }
    }

    const cartDTO = mapCartToDTO(cart, courseDetailsMap, learningPathDetailsMap, enrolledCourseIds || []);
    return cartDTO;
  }

  async addToCart(userId: Types.ObjectId, itemId: Types.ObjectId, type: "course" | "learningPath"): Promise<CartItemDTO[] | null> {
    let updatedCart: ICart;
    if (type === "course") {
      updatedCart = await this._cartRepository.addCourse(userId, itemId);
    } else {
      updatedCart = await this._cartRepository.addLearningPath(userId, itemId);
    }

    // Collect all course IDs (from cart courses and learning paths)
    const courseIds = Array.isArray(updatedCart.courses)
      ? updatedCart.courses
          .map((course) =>
            course instanceof Types.ObjectId
              ? course.toString()
              : "courseName" in course && course._id
              ? course._id.toString()
              : null
          )
          .filter((id): id is string => id !== null)
      : [];

    const learningPathIds = Array.isArray(updatedCart.learningPaths)
      ? updatedCart.learningPaths
          .map((lp) =>
            lp instanceof Types.ObjectId
              ? lp.toString()
              : "title" in lp && lp._id
              ? lp._id.toString()
              : null
          )
          .filter((id): id is string => id !== null)
      : [];

    // Fetch learning paths to get their course IDs
    const allCourseIds = new Set<string>(courseIds);
    let learningPathDetailsMap = new Map<string, { price: number; thumbnailUrl: string }>();

    if (learningPathIds.length > 0) {
      const learningPathsResult = await this._lmsRepository.getLearningPathsByIds(
        learningPathIds.map((id) => new Types.ObjectId(id))
      );
      const learningPaths: ILearningPath[] = learningPathsResult.paths;

      for (const lp of learningPaths) {
        const lpCourseIds = lp.items
          .map((item) =>
            item.courseId instanceof Types.ObjectId
              ? item.courseId.toString()
              : item.courseId._id.toString()
          );
        lpCourseIds.forEach((id) => allCourseIds.add(id));
      }
    }

    // Fetch course details and offers for all course IDs
    const courseDetailsPromises = Array.from(allCourseIds).map((id) => this._courseRepository.getCourseDetails(id));
    const courseDetailsResults = await Promise.all(courseDetailsPromises);
    const courseDetailsMap = new Map<string, { price: number; thumbnailUrl: string }>();

    // Fetch offers for all courses
    const offers = await this._courseOfferRepository.findValidOffersByCourseIds(Array.from(allCourseIds));
    const offerMap = new Map<string, ICourseOffer>(
      offers.map((offer) => [offer.courseId.toString(), offer])
    );

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
        const courseId = details.course._id.toString();
        const offer = offerMap.get(courseId);
        const basePrice = details.course.price;
        const price = offer && offer.isActive && offer.status === "approved"
          ? basePrice * (1 - offer.discountPercentage / 100)
          : basePrice;
        console.log(`Course ${courseId}: basePrice=${basePrice}, offer=${JSON.stringify(offer)}, finalPrice=${price}`);
        courseDetailsMap.set(courseId, {
          price,
          thumbnailUrl,
        });
      }
    }

    // Calculate learning path details
    if (learningPathIds.length > 0) {
      const learningPathsResult = await this._lmsRepository.getLearningPathsByIds(
        learningPathIds.map((id) => new Types.ObjectId(id))
      );
      const learningPaths: ILearningPath[] = learningPathsResult.paths;

      for (const lp of learningPaths) {
        let thumbnailUrl = lp.thumbnailUrl || "";
        if (thumbnailUrl && !thumbnailUrl.includes("AWSAccessKeyId")) {
          try {
            thumbnailUrl = await getPresignedUrl(thumbnailUrl);
          } catch (error) {
            console.error(`Failed to generate presigned URL for learning path ${lp._id}:`, error);
          }
        }

        // Calculate total price using courseDetailsMap
        const lpCourseIds = lp.items
          .map((item) =>
            item.courseId instanceof Types.ObjectId
              ? item.courseId.toString()
              : item.courseId._id.toString()
          );
        let totalPrice = 0;
        for (const courseId of lpCourseIds) {
          const courseDetails = courseDetailsMap.get(courseId);
          if (courseDetails) {
            totalPrice += courseDetails.price;
          }
        }

        learningPathDetailsMap.set(lp._id.toString(), {
          price: totalPrice,
          thumbnailUrl,
        });
      }
    }

    const cartDTO = mapCartToDTO(updatedCart, courseDetailsMap, learningPathDetailsMap);
    return cartDTO;
  }

  async removeFromCart(userId: Types.ObjectId, itemId: Types.ObjectId, type: "course" | "learningPath"): Promise<CartItemDTO[] | null> {
    let updatedCart: ICart | null;
    if (type === "course") {
      updatedCart = await this._cartRepository.removeCourse(userId, itemId);
    } else {
      updatedCart = await this._cartRepository.removeLearningPath(userId, itemId);
    }
    if (!updatedCart) return null;

    // Collect all course IDs (from cart courses and learning paths)
    const courseIds = Array.isArray(updatedCart.courses)
      ? updatedCart.courses
          .map((course) =>
            course instanceof Types.ObjectId
              ? course.toString()
              : "courseName" in course && course._id
              ? course._id.toString()
              : null
          )
          .filter((id): id is string => id !== null)
      : [];

    const learningPathIds = Array.isArray(updatedCart.learningPaths)
      ? updatedCart.learningPaths
          .map((lp) =>
            lp instanceof Types.ObjectId
              ? lp.toString()
              : "title" in lp && lp._id
              ? lp._id.toString()
              : null
          )
          .filter((id): id is string => id !== null)
      : [];

    // Fetch learning paths to get their course IDs
    const allCourseIds = new Set<string>(courseIds);
    let learningPathDetailsMap = new Map<string, { price: number; thumbnailUrl: string }>();

    if (learningPathIds.length > 0) {
      const learningPathsResult = await this._lmsRepository.getLearningPathsByIds(
        learningPathIds.map((id) => new Types.ObjectId(id))
      );
      const learningPaths: ILearningPath[] = learningPathsResult.paths;

      for (const lp of learningPaths) {
        const lpCourseIds = lp.items
          .map((item) =>
            item.courseId instanceof Types.ObjectId
              ? item.courseId.toString()
              : item.courseId._id.toString()
          );
        lpCourseIds.forEach((id) => allCourseIds.add(id));
      }
    }

    // Fetch course details and offers for all course IDs
    const courseDetailsPromises = Array.from(allCourseIds).map((id) => this._courseRepository.getCourseDetails(id));
    const courseDetailsResults = await Promise.all(courseDetailsPromises);
    const courseDetailsMap = new Map<string, { price: number; thumbnailUrl: string }>();

    // Fetch offers for all courses
    const offers = await this._courseOfferRepository.findValidOffersByCourseIds(Array.from(allCourseIds));
    const offerMap = new Map<string, ICourseOffer>(
      offers.map((offer) => [offer.courseId.toString(), offer])
    );

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
        const courseId = details.course._id.toString();
        const offer = offerMap.get(courseId);
        const basePrice = details.course.price;
        const price = offer && offer.isActive && offer.status === "approved"
          ? basePrice * (1 - offer.discountPercentage / 100)
          : basePrice;
        console.log(`Course ${courseId}: basePrice=${basePrice}, offer=${JSON.stringify(offer)}, finalPrice=${price}`);
        courseDetailsMap.set(courseId, {
          price,
          thumbnailUrl,
        });
      }
    }

    // Calculate learning path details
    if (learningPathIds.length > 0) {
      const learningPathsResult = await this._lmsRepository.getLearningPathsByIds(
        learningPathIds.map((id) => new Types.ObjectId(id))
      );
      const learningPaths: ILearningPath[] = learningPathsResult.paths;

      for (const lp of learningPaths) {
        let thumbnailUrl = lp.thumbnailUrl || "";
        if (thumbnailUrl && !thumbnailUrl.includes("AWSAccessKeyId")) {
          try {
            thumbnailUrl = await getPresignedUrl(thumbnailUrl);
          } catch (error) {
            console.error(`Failed to generate presigned URL for learning path ${lp._id}:`, error);
          }
        }

        // Calculate total price using courseDetailsMap
        const lpCourseIds = lp.items
          .map((item) =>
            item.courseId instanceof Types.ObjectId
              ? item.courseId.toString()
              : item.courseId._id.toString()
          );
        let totalPrice = 0;
        for (const courseId of lpCourseIds) {
          const courseDetails = courseDetailsMap.get(courseId);
          if (courseDetails) {
            totalPrice += courseDetails.price;
          }
        }

        learningPathDetailsMap.set(lp._id.toString(), {
          price: totalPrice,
          thumbnailUrl,
        });
      }
    }

    const cartDTO = mapCartToDTO(updatedCart, courseDetailsMap, learningPathDetailsMap);
    return cartDTO;
  }

  async clearCart(userId: Types.ObjectId): Promise<boolean> {
    const clearedCart = await this._cartRepository.clear(userId);
    return !!clearedCart;
  }

  async getCartRaw(userId: Types.ObjectId): Promise<ICart | null> {
    return await this._cartRepository.findCartByUserId(userId);
  }
}