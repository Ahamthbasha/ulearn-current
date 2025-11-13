import { useState, useEffect } from "react";
import { X, Star, Loader2, Sparkles } from "lucide-react";
import { createReview, updateReview } from "../../api/action/StudentAction";
import { toast } from "react-toastify";
import type { ReviewModalProps } from "./interface/studentComponentInterface";

const ReviewModal = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  completionPercentage,
  onReviewSubmitted,
  existingReview,
}: ReviewModalProps) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState(existingReview?.reviewText || "");
  const [submitting, setSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const isEditMode = !!existingReview;

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
      // Set existing review data when opening in edit mode
      if (existingReview) {
        setRating(existingReview.rating);
        setReviewText(existingReview.reviewText);
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, existingReview]);

  const validateReview = (text: string): { isValid: boolean; message: string } => {
    const trimmed = text.trim();
    
    // Check minimum length
    if (trimmed.length < 10) {
      return { isValid: false, message: "Review must be at least 10 characters long" };
    }

    // Check if review contains only spaces, special characters, or numbers
    const meaningfulChars = trimmed.replace(/[^a-zA-Z]/g, '');
    if (meaningfulChars.length < 5) {
      return { isValid: false, message: "Please write a meaningful review with actual words" };
    }

    // Check for repeated characters (e.g., "aaaaaaaaaa")
    const repeatedPattern = /(.)\1{4,}/;
    if (repeatedPattern.test(trimmed)) {
      return { isValid: false, message: "Please avoid excessive repetition of characters" };
    }

    // Check for minimum word count (at least 3 words)
    const words = trimmed.split(/\s+/).filter(word => word.length > 0);
    if (words.length < 3) {
      return { isValid: false, message: "Please write at least 3 words in your review" };
    }

    // Check if review is not just random characters
    const hasVowels = /[aeiouAEIOU]/.test(trimmed);
    if (!hasVowels && meaningfulChars.length > 0) {
      return { isValid: false, message: "Please write a valid review with actual words" };
    }

    return { isValid: true, message: "" };
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    const validation = validateReview(reviewText);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    try {
      setSubmitting(true);
      
      if (isEditMode && existingReview) {
        // Update existing review
        await updateReview(existingReview.id, {
          rating,
          reviewText: reviewText.trim(),
        });
        toast.success("Review updated successfully!");
      } else {
        // Create new review
        await createReview({
          courseId,
          rating,
          reviewText: reviewText.trim(),
          completionPercentage,
        });
        toast.success("Thank you for your review!");
      }

      setRating(0);
      setReviewText("");
      onReviewSubmitted?.();
      handleClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'submit'} review`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setRating(0);
      setReviewText("");
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isAnimating ? "backdrop-blur-md bg-black/60" : "backdrop-blur-none bg-black/0"
      }`}
      onClick={handleClose}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div
        className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden transform transition-all duration-300 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti effect header */}
        <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 text-white p-6 sm:p-8 overflow-hidden">
          {/* Animated sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Sparkles className="absolute top-4 left-8 w-6 h-6 text-yellow-300 animate-pulse" />
            <Sparkles className="absolute top-12 right-12 w-5 h-5 text-pink-300 animate-pulse delay-300" />
            <Sparkles className="absolute bottom-8 left-16 w-4 h-4 text-blue-300 animate-pulse delay-500" />
            <Sparkles className="absolute top-20 right-24 w-7 h-7 text-yellow-200 animate-pulse delay-700" />
          </div>

          <div className="relative flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-2xl sm:text-3xl font-bold">
                  {isEditMode ? "Edit Your Review" : "Congratulations!"}
                </h2>
                {!isEditMode && <span className="text-3xl animate-bounce">🎉</span>}
              </div>
              <p className="text-purple-100 text-sm sm:text-base">
                {isEditMode 
                  ? "Update your course review" 
                  : "You've successfully completed the course"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full transition-all transform hover:scale-110 hover:rotate-90 duration-300"
              disabled={submitting}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)] p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            {/* Course Info Card */}
            <div className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-4 sm:p-6 border-2 border-purple-200 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-2xl"></div>
              <div className="relative">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {courseTitle}
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-white rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 transition-all duration-1000 rounded-full"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-purple-700">
                    {completionPercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Rating Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <label className="block text-sm sm:text-base font-bold text-gray-900 mb-4">
                How would you rate this course? <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-all duration-200 hover:scale-125 focus:outline-none transform"
                    disabled={submitting}
                  >
                    <Star
                      className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400 drop-shadow-lg"
                          : "text-gray-300"
                      } transition-all duration-200`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <div className="mt-4 text-center sm:text-left">
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-semibold rounded-full text-sm sm:text-base animate-fade-in">
                    {rating === 5
                      ? "🌟 Excellent!"
                      : rating === 4
                      ? "😊 Great!"
                      : rating === 3
                      ? "👍 Good"
                      : rating === 2
                      ? "😐 Fair"
                      : "😕 Poor"}
                  </span>
                </div>
              )}
            </div>

            {/* Review Text Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <label className="block text-sm sm:text-base font-bold text-gray-900 mb-3">
                Share your experience <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you like about this course? What could be improved?"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 resize-none transition-all text-sm sm:text-base"
                rows={5}
                disabled={submitting}
                maxLength={1000}
              />
              <div className="flex justify-between mt-2 text-xs sm:text-sm">
                <p className="text-gray-500">Minimum 3 words, 10 characters</p>
                <p
                  className={`font-medium ${
                    reviewText.trim().length < 10
                      ? "text-red-500"
                      : reviewText.length > 900
                      ? "text-orange-500"
                      : "text-green-600"
                  }`}
                >
                  {reviewText.length}/1000
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {!isEditMode && (
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 hover:border-gray-400 active:scale-95 transition-all text-sm sm:text-base"
                  disabled={submitting}
                >
                  Skip for now
                </button>
              )}
              {isEditMode && (
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 hover:border-gray-400 active:scale-95 transition-all text-sm sm:text-base"
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0 || reviewText.trim().length < 10 || !validateReview(reviewText).isValid}
                className="flex-1 px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isEditMode ? "Updating..." : "Submitting..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>{isEditMode ? "Update Review" : "Submit Review"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;