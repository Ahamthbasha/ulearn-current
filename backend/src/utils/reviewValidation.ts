
export const validateReview = (rating: number, reviewText: string): string | null => {
  if (!rating || rating < 1 || rating > 5) return "Rating must be 1–5 stars";
  if (!reviewText || reviewText.trim().length < 10) return "Review must be at least 10 characters";
  if (reviewText.trim().length > 1000) return "Review too long (max 1000 chars)";
  return null;
};