import { COURSE_OFFER_ERROR_MESSAGE,VALID_OFFER_STATUSES,OfferStatus } from "../constants";

export function validateCourseOfferInput(offerId: string, status: string, reviews?: string): string | null {
  if (!offerId) return COURSE_OFFER_ERROR_MESSAGE.INVALID_INPUT_OFFER_ID;
  if (!status || !VALID_OFFER_STATUSES.includes(status as OfferStatus)) {
    return COURSE_OFFER_ERROR_MESSAGE.INVALID_INPUT_STATUS;
  }
  if (reviews !== undefined && typeof reviews !== "string") {
    return COURSE_OFFER_ERROR_MESSAGE.INVALID_INPUT_REVIEWS;
  }
  return null;
}