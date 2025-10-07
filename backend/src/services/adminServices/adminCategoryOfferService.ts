// import { Types } from "mongoose";
// import { ICategoryModel } from "../../models/categoryModel";
// import { ICourse } from "../../models/courseModel";
// import { ICategoryOffer } from "../../models/categoryOfferModel";
// import { ICourseOffer } from "../../models/courseOfferModel";
// import { ICourseRepository } from "../../repositories/interfaces/ICourseRepository";
// import { IAdminCategoryOfferRepo } from "../../repositories/adminRepository/interface/IAdminCategoryOfferRepo";
// import { IAdminCategoryOfferService } from "./interface/IAdminCategoryOfferService";
// import { IAdminCategoryRepository } from "../../repositories/adminRepository/interface/IAdminCategoryRepository";
// import { IAdminCourseOfferRepo } from "../../repositories/adminRepository/interface/IAdminCourseOfferRepo";

// export class AdminCategoryOfferService implements IAdminCategoryOfferService {
//   private _courseRepo: ICourseRepository;
//   private _categoryOfferRepo: IAdminCategoryOfferRepo;
//   private _categoryRepo: IAdminCategoryRepository;
//   private _courseOfferRepo: IAdminCourseOfferRepo;

//   constructor(
//     courseRepo: ICourseRepository,
//     categoryOfferRepo: IAdminCategoryOfferRepo,
//     categoryRepo: IAdminCategoryRepository,
//     courseOfferRepo: IAdminCourseOfferRepo,
//   ) {
//     this._courseRepo = courseRepo;
//     this._categoryOfferRepo = categoryOfferRepo;
//     this._categoryRepo = categoryRepo;
//     this._courseOfferRepo = courseOfferRepo;
//   }

//   async getListedCategories(): Promise<ICategoryModel[]> {
//     return this._categoryRepo.getAllCategoriesPaginated(1, Number.MAX_SAFE_INTEGER, undefined).then(result => result.data.filter(category => category.isListed));
//   }

//   async createCategoryOffer(
//     categoryId: string,
//     discountPercentage: number,
//     startDate: Date,
//     endDate: Date,
//   ): Promise<ICategoryOffer> {
//     if (discountPercentage < 0 || discountPercentage > 100) {
//       throw new Error("Discount percentage must be between 0 and 100");
//     }
//     if (startDate >= endDate) {
//       throw new Error("Start date must be before end date");
//     }

//     const category = await this._categoryRepo.findById(categoryId);
//     if (!category) {
//       throw new Error("Category not found");
//     }
//     if (!category.isListed) {
//       throw new Error("Category must be listed to create an offer");
//     }

//     const existingOffer = await this._categoryOfferRepo.findOne({ 
//       categoryId: new Types.ObjectId(categoryId), 
//       isActive: true 
//     });
//     if (existingOffer) {
//       throw new Error("An active offer already exists for this category. Use edit to update.");
//     }

//     const courses: ICourse[] = await this._courseRepo.find({
//       category: new Types.ObjectId(categoryId),
//       isPublished: true,
//       isListed: true,
//       isVerified: true,
//     });

//     const courseOffers: Types.ObjectId[] = [];
//     for (const course of courses) {
//       const courseId = course._id;
//       if (!Types.ObjectId.isValid(courseId)) {
//         throw new Error(`Invalid course ID: ${courseId}`);
//       }

//       // Check for existing active course offer
//       const existingCourseOffer = await this._courseOfferRepo.findOne({ 
//         courseId: courseId, 
//         isActive: true 
//       });
      
//       if (existingCourseOffer) {
//         // Compare discounts: if existing discount >= category discount, skip
//         if (existingCourseOffer.discountPercentage >= discountPercentage) {
//           console.log(`Skipping course ${courseId}: existing discount (${existingCourseOffer.discountPercentage}%) is higher or equal to category discount (${discountPercentage}%)`);
//           continue; // Skip creating new course offer
//         }
//         // If category discount > existing, update the existing one instead of creating new
//         await this._courseOfferRepo.updateById(existingCourseOffer._id.toString(), {
//           discountPercentage,
//           startDate,
//           endDate,
//         });
//         courseOffers.push(existingCourseOffer._id);
//         console.log(`Updated existing course offer for course ${courseId} with higher category discount (${discountPercentage}%)`);
//       } else {
//         // No existing offer, create new
//         const courseOfferData: Partial<ICourseOffer> = {
//           courseId: courseId,
//           discountPercentage,
//           startDate,
//           endDate,
//           isActive: true,
//         };
//         const courseOffer = await this._courseOfferRepo.create(courseOfferData);
//         if (!courseOffer || !Types.ObjectId.isValid(courseOffer._id)) {
//           throw new Error(`Invalid course offer ID for course ${courseId}`);
//         }
//         courseOffers.push(courseOffer._id);
//         await this._courseRepo.updateById(courseId.toString(), { 
//           offer: courseOffer._id 
//         });
//         console.log(`Created new course offer for course ${courseId} with category discount (${discountPercentage}%)`);
//       }
//     }

//     if (courseOffers.length === 0) {
//       throw new Error("No eligible courses found where category offer provides better discount");
//     }

//     const offerData: Partial<ICategoryOffer> = {
//       categoryId: new Types.ObjectId(categoryId),
//       discountPercentage,
//       startDate,
//       endDate,
//       isActive: true,
//       courseOffers,
//     };
//     const categoryOffer = await this._categoryOfferRepo.create(offerData);

//     return categoryOffer;
//   }

//   async editCategoryOffer(
//     categoryOfferId: string,
//     discountPercentage: number,
//     startDate: Date,
//     endDate: Date,
//   ): Promise<ICategoryOffer> {
//     if (discountPercentage < 0 || discountPercentage > 100) {
//       throw new Error("Discount percentage must be between 0 and 100");
//     }
//     if (startDate >= endDate) {
//       throw new Error("Start date must be before end date");
//     }

//     const existingOffer = await this._categoryOfferRepo.findById(categoryOfferId);
//     if (!existingOffer) {
//       throw new Error("No offer found for this category offer ID.");
//     }

//     // Get all eligible courses in the category (re-evaluate all, not just associated)
//     const courses: ICourse[] = await this._courseRepo.find({
//       category: existingOffer.categoryId,
//       isPublished: true,
//       isListed: true,
//       isVerified: true,
//     });

//     const updatedCourseOffers: Types.ObjectId[] = [];
//     for (const course of courses) {
//       const courseId = course._id;
//       if (!Types.ObjectId.isValid(courseId)) {
//         throw new Error(`Invalid course ID: ${courseId}`);
//       }

//       // Check for any existing active course offer for this course
//       const currentCourseOffer = await this._courseOfferRepo.findOne({ 
//         courseId: courseId, 
//         isActive: true 
//       });

//       if (currentCourseOffer) {
//         // Compare: if new category discount > current course offer discount, update/create
//         if (discountPercentage > currentCourseOffer.discountPercentage) {
//           // Check if it's already associated with this category offer
//           const isAssociated = existingOffer.courseOffers.some(coId => coId.toString() === currentCourseOffer._id.toString());
          
//           if (isAssociated) {
//             // Update existing associated course offer
//             await this._courseOfferRepo.updateById(currentCourseOffer._id.toString(), {
//               discountPercentage,
//               startDate,
//               endDate,
//             });
//             updatedCourseOffers.push(currentCourseOffer._id);
//           } else {
//             // Create new course offer for this category (override with higher discount)
//             const courseOfferData: Partial<ICourseOffer> = {
//               courseId: courseId,
//               discountPercentage,
//               startDate,
//               endDate,
//               isActive: true,
//             };
//             const newCourseOffer = await this._courseOfferRepo.create(courseOfferData);
//             if (!newCourseOffer || !Types.ObjectId.isValid(newCourseOffer._id)) {
//               throw new Error(`Invalid course offer ID for course ${courseId}`);
//             }
//             updatedCourseOffers.push(newCourseOffer._id);
//             await this._courseRepo.updateById(courseId.toString(), { 
//               offer: newCourseOffer._id 
//             });
//           }
//           console.log(`Applied higher category discount (${discountPercentage}%) to course ${courseId} (previous: ${currentCourseOffer.discountPercentage}%)`);
//         } else {
//           console.log(`Skipping course ${courseId}: current discount (${currentCourseOffer.discountPercentage}%) is higher or equal to new category discount (${discountPercentage}%)`);
//           // Keep the existing one in updatedCourseOffers if it was associated
//           if (existingOffer.courseOffers.some(coId => coId.toString() === currentCourseOffer._id.toString())) {
//             updatedCourseOffers.push(currentCourseOffer._id);
//           }
//         }
//       } else {
//         // No existing offer, create new with category details
//         const courseOfferData: Partial<ICourseOffer> = {
//           courseId: courseId,
//           discountPercentage,
//           startDate,
//           endDate,
//           isActive: true,
//         };
//         const courseOffer = await this._courseOfferRepo.create(courseOfferData);
//         if (!courseOffer || !Types.ObjectId.isValid(courseOffer._id)) {
//           throw new Error(`Invalid course offer ID for course ${courseId}`);
//         }
//         updatedCourseOffers.push(courseOffer._id);
//         await this._courseRepo.updateById(courseId.toString(), { 
//           offer: courseOffer._id 
//         });
//         console.log(`Created new course offer for course ${courseId} with updated category discount (${discountPercentage}%)`);
//       }
//     }

//     // Update the category offer with new data and updated courseOffers array
//     const updateData: Partial<ICategoryOffer> = {
//       discountPercentage,
//       startDate,
//       endDate,
//       courseOffers: updatedCourseOffers,
//     };
//     const offer = await this._categoryOfferRepo.updateById(categoryOfferId, updateData);
//     if (!offer) {
//       throw new Error("Failed to update category offer");
//     }

//     return offer;
//   }

//   async toggleCategoryOfferActive(categoryOfferId: string): Promise<ICategoryOffer> {
//     const offer = await this._categoryOfferRepo.toggleActiveById(categoryOfferId);
//     if (!offer) {
//       throw new Error("No offer found for this category offer ID");
//     }

//     // Update associated course offers status
//     for (const courseOfferId of offer.courseOffers) {
//       if (!Types.ObjectId.isValid(courseOfferId)) {
//         throw new Error(`Invalid course offer ID: ${courseOfferId}`);
//       }
//       await this._courseOfferRepo.updateById(courseOfferId.toString(), { isActive: offer.isActive });
//       if (!offer.isActive) {
//         const courseOffer = await this._courseOfferRepo.findById(courseOfferId.toString());
//         if (courseOffer && courseOffer.courseId && Types.ObjectId.isValid(courseOffer.courseId)) {
//           // Before removing, check if there's a better offer for the course
//           const betterOffer = await this._courseOfferRepo.findOne({
//             courseId: courseOffer.courseId,
//             isActive: true,
//             discountPercentage: { $gt: courseOffer.discountPercentage }
//           });
//           if (!betterOffer) {
//             await this._courseRepo.removeOffer(courseOffer.courseId.toString());
//           } else {
//             // Link to the better offer instead
//             await this._courseRepo.updateById(courseOffer.courseId.toString(), { offer: betterOffer._id });
//           }
//         }
//       }
//     }

//     return offer;
//   }

//   async deleteCategoryOffer(categoryOfferId: string): Promise<void> {
//     const offer = await this._categoryOfferRepo.deleteById(categoryOfferId);
//     if (!offer) {
//       throw new Error("No offer found for this category offer ID");
//     }

//     // Clean up associated course offers
//     for (const courseOfferId of offer.courseOffers) {
//       if (!Types.ObjectId.isValid(courseOfferId)) {
//         throw new Error(`Invalid course offer ID: ${courseOfferId}`);
//       }
//       const courseOffer = await this._courseOfferRepo.deleteById(courseOfferId.toString());
//       if (courseOffer && courseOffer.courseId && Types.ObjectId.isValid(courseOffer.courseId)) {
//         // Before removing link, check if there's another active offer for the course
//         const remainingOffer = await this._courseOfferRepo.findOne({
//           courseId: courseOffer.courseId,
//           isActive: true,
//           _id: { $ne: courseOffer._id }
//         });
//         if (remainingOffer) {
//           // Link to the remaining best offer
//           await this._courseRepo.updateById(courseOffer.courseId.toString(), { offer: remainingOffer._id });
//         } else {
//           await this._courseRepo.removeOffer(courseOffer.courseId.toString());
//         }
//       }
//     }
//   }

//   async getCategoryOffers(
//     page: number,
//     limit: number,
//     search?: string,
//   ): Promise<{ data: ICategoryOffer[]; total: number }> {
//     if (page < 1 || limit < 1) {
//       throw new Error("Page and limit must be positive integers");
//     }

//     return this._categoryOfferRepo.getCategoryOffers(page, limit, search);
//   }

//   async getCategoryOfferById(categoryOfferId: string): Promise<ICategoryOffer | null> {
//     const offer = await this._categoryOfferRepo.getCategoryOfferById(categoryOfferId);
//     if (!offer) {
//       throw new Error("Category offer not found");
//     }
//     return offer;
//   }
// }