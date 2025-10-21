import { formatDate } from "../../utils/dateFormat";
import { ICourseOfferListDTO, ICourseOfferDetailDTO,PopulatedCourseOffer } from "../../dto/adminDTO/adminCourseOfferDTO";

export const mapToCourseOfferListDTO = (offer: PopulatedCourseOffer): ICourseOfferListDTO => {
  return {
    offerId: offer._id.toString(),
    courseId: offer.courseId._id.toString(),
    courseName: offer.courseId.courseName,
    instructorId: offer.instructorId._id.toString(),
    instructorName: offer.instructorId.username || offer.instructorId.email,
    discount: offer.discountPercentage,
    status: offer.status,
  };
};

export const mapToCourseOfferDetailDTO = (offer: PopulatedCourseOffer): ICourseOfferDetailDTO => {
  return {
    courseOfferId: offer._id.toString(),
    courseId: offer.courseId._id.toString(),
    courseName: offer.courseId.courseName,
    instructorId: offer.instructorId._id.toString(),
    instructorName: offer.instructorId.username || offer.instructorId.email,
    discount: offer.discountPercentage,
    startDate: formatDate(offer.startDate),
    endDate: formatDate(offer.endDate),
    status: offer.status,
    review: offer.reviews || "",
    coursePrice: offer.courseId.price,
    discountedPrice: offer.discountedPrice || offer.courseId.price * (1 - offer.discountPercentage / 100),
    courseVerified:offer.courseId.isVerified
  };
};