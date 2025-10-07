import { ICourseOffer } from "../../models/courseOfferModel";
import { CourseOfferListDTO, CourseOfferDetailDTO } from "../../dto/instructorDTO/courseOfferDTO";
import { formatDate } from "../../utils/dateFormat";

export const CourseOfferMapper = {
  
  toCourseOfferDTO(offer: ICourseOffer): CourseOfferListDTO {
    const course = offer.courseId as unknown as { courseName: string; _id: string };
    return {
      courseOfferId: offer._id.toString(),
      courseId: course._id,
      courseName: course.courseName,
      discount: offer.discountPercentage,
      status: offer.status,
      startDate: formatDate(offer.startDate),
      endDate: formatDate(offer.endDate),
    };
  },

  toCourseOfferListDTOs(offers: ICourseOffer[]): CourseOfferListDTO[] {
    return offers.map(offer => this.toCourseOfferDTO(offer));
  },

  toCourseOfferDetailDTO(offer: ICourseOffer): CourseOfferDetailDTO {
    const course = offer.courseId as unknown as { price: number; _id: string; courseName: string };
    const discountPrice = ('discountedPrice' in offer && typeof offer.discountedPrice === "number")
      ? offer.discountedPrice
      : course.price * (1 - offer.discountPercentage / 100);

    return {
      courseOfferId: offer._id.toString(),
      courseId: course._id,
      courseName:course.courseName,
      courseOriginalPrice: course.price,
      discount: offer.discountPercentage,
      courseDiscountPrice: discountPrice,
      startDate: formatDate(offer.startDate),
      endDate: formatDate(offer.endDate),
      status: offer.status,
      reviews: offer.reviews || "",
    };
  }
};
