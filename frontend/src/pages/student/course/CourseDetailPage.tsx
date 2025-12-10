import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  courseDetail,
  getCart,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  isItemInWishlist,
  deleteReview,
  getMyReviewForCourse,
} from "../../../api/action/StudentAction";
import {
  Heart,
  Play,
  Clock,
  Award,
  CheckCircle,
  Users,
  Smartphone,
  FileText,
  Star,
  MessageCircle,
  Edit2,
  Trash2,
} from "lucide-react";
import { isStudentLoggedIn } from "../../../utils/auth";
import type { CartItemDTO } from "../interface/studentInterface";
import type { ApiError } from "../../../types/interfaces/ICommon";
import ReviewModal from "../../../components/StudentComponents/ReviewModal";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import type { CourseCardProps, CourseDetail, CourseReview, ModalReviewMin, MyReviewFullResponse } from "../interface/studentCourseDetailInterface";


const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isInCart, setIsInCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [existingReview, setExistingReview] = useState<ModalReviewMin | null>(null);
  const [myReview, setMyReview] = useState<CourseReview | null>(null);

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);

  const openConfirmModal = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage("");
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    closeConfirmModal();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await courseDetail(courseId!);
        const courseData = "data" in res ? res.data : res;
        setCourse(courseData);

        if (isStudentLoggedIn()) {
          const [cartRes, wishRes] = await Promise.all([
            getCart(),
            isItemInWishlist(courseId!, "course"),
          ]);
          setIsInCart(
            cartRes.some(
              (i: CartItemDTO) => i.itemId === courseId && i.type === "course"
            )
          );
          setIsInWishlist(wishRes.exists);

          if (courseData.userReviewed) {
            try {
              const myReviewRes: MyReviewFullResponse = await getMyReviewForCourse(courseId!);

              const modal: ModalReviewMin = {
                id: myReviewRes._id,
                courseId: myReviewRes.courseId,
                studentId: myReviewRes.studentId,
                rating: myReviewRes.rating,
                reviewText: myReviewRes.reviewText,
                completionPercentage: courseData.completionPercentage || 0,
                createdAt: myReviewRes.createdAt,
              };
              setExistingReview(modal);
              setMyReview({
                reviewId: myReviewRes._id,
                username: "You",
                rating: myReviewRes.rating,
                reviewText: myReviewRes.reviewText,
                profilePicUrl: undefined,
              });
            } catch (e) {
              console.warn("my review fetch failed", e);
            }
          }
        }
      } catch (error) {
        const apiError = error as ApiError;
        toast.error(
          apiError.response?.data?.message ||
            apiError.message ||
            "Failed to fetch course details"
        );
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchData();
  }, [courseId]);

  const handlePlayClick = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleAddToCart = async () => {
    if (!isStudentLoggedIn()) return toast.info("Please log in to add to cart");
    try {
      await addToCart(courseId!, "course");
      toast.success("Course added to cart");
      setIsInCart(true);
    } catch (e: any) {
      if (e.response?.status === 409) {
        toast.info("Course is already in cart");
        setIsInCart(true);
      } else toast.error(e.response?.data?.message || "Failed to add to cart");
    }
  };

  const handleWishlistToggle = async () => {
    if (!isStudentLoggedIn()) return toast.info("Please log in to manage wishlist");
    try {
      if (isInWishlist) {
        await removeFromWishlist(courseId!, "course");
        toast.success("Removed from wishlist");
        setIsInWishlist(false);
      } else {
        await addToWishlist(courseId!, "course");
        toast.success("Added to wishlist");
        setIsInWishlist(true);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Wishlist operation failed");
    }
  };
  const openReviewModal = (edit?: ModalReviewMin) => {
    setExistingReview(edit || null);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = async () => {
    setShowReviewModal(false);
    setExistingReview(null);
    setMyReview(null);
    try {
      const refreshed = await courseDetail(courseId!);
      const data = "data" in refreshed ? refreshed.data : refreshed;
      setCourse(data);
      if (data.userReviewed) {
        const rev: MyReviewFullResponse = await getMyReviewForCourse(courseId!);
        setMyReview({
          reviewId: rev._id,
          username: "You",
          rating: rev.rating,
          reviewText: rev.reviewText,
          profilePicUrl: undefined,
        });
        setExistingReview({
          id: rev._id,
          courseId: rev.courseId,
          studentId: rev.studentId,
          rating: rev.rating,
          reviewText: rev.reviewText,
          completionPercentage: data.completionPercentage || 0,
          createdAt: rev.createdAt,
        });
      }
    } catch {
      toast.error("Failed to refresh course");
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await deleteReview(id);
      toast.success("Review deleted");
      setMyReview(null);
      setExistingReview(null);
      const refreshed = await courseDetail(courseId!);
      setCourse("data" in refreshed ? refreshed.data : refreshed);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete review");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sky-600"></div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center bg-sky-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Course not found</h2>
        <button
          onClick={() => navigate("/user/courses")}
          className="text-sky-600 hover:text-sky-700 font-medium"
        >
          Browse all courses
        </button>
      </div>
    );
  }

  const hasOffer =
    course.discountedPrice !== undefined && course.originalPrice > course.discountedPrice;
  const discount = hasOffer
    ? Math.round(((course.originalPrice - course.discountedPrice!) / course.originalPrice) * 100)
    : 0;
  const totalChapters = course.modules?.reduce((a, m) => a + m.chapterCount, 0) || 0;
  const totalReviews = course.reviews.length + (myReview ? 1 : 0);
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count:
      course.reviews.filter((r) => r.rating === star).length + (myReview?.rating === star ? 1 : 0),
  }));
  const learningOutcomes =
    course.modules?.slice(0, 4).map((m) => m.description || `Learn ${m.moduleTitle}`) || [];
  while (learningOutcomes.length < 4) learningOutcomes.push(`Master ${course.courseName} concepts`);
  const canReview = course.isEnrolled && course.completionPercentage === 100;

  const DemoVideoPlayer = ({ className = "" }: { className?: string }) => (
    <div className={`relative bg-black rounded-xl overflow-hidden shadow-lg ${className}`}>
      <video
        ref={videoRef}
        poster={course.thumbnailUrl}
        src={course.demoVideoUrl}
        className="w-full h-full object-cover"
        controls={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
          onClick={handlePlayClick}
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition">
            <Play className="w-8 h-8 text-gray-900 ml-1" />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
      {/* HERO – THUMBNAIL + INFO */}
      <section className="bg-gradient-to-b from-sky-100 to-sky-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT – CONTENT */}
            <div className="lg:col-span-2 space-y-6">
              <nav className="text-sm text-sky-600 font-medium">
                <span className="hover:underline cursor-pointer">{course.categoryName}</span>
                <span className="mx-1">›</span>
                <span>{course.courseName}</span>
              </nav>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                {course.courseName}
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl">{course.description}</p>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold text-xs">
                    {course.level}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-600" />
                  <span className="font-medium">by {course.instructorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-600" />
                  <span>{course.duration}</span>
                </div>
                {totalReviews > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-800">
                      {course.averageRating.toFixed(1)} ({totalReviews} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* THUMBNAIL IMAGE (BIG) */}
              <div className="mt-8">
                <img
                  src={course.thumbnailUrl}
                  alt={course.courseName}
                  className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-2xl shadow-xl"
                />
              </div>

              {/* WHAT YOU'LL LEARN – MOBILE */}
              <div className="lg:hidden bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-800">What you'll learn</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {learningOutcomes.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT – CARD (DESKTOP) */}
            <div className="hidden lg:block sticky top-6">
              <CourseCard
                course={course}
                hasOffer={hasOffer}
                discount={discount}
                isInCart={isInCart}
                isInWishlist={isInWishlist}
                onAddToCart={handleAddToCart}
                onWishlistToggle={handleWishlistToggle}
                navigate={navigate}
                totalChapters={totalChapters}
                avgRating={course.averageRating}
                totalReviews={totalReviews}
                DemoVideoPlayer={DemoVideoPlayer}
              />
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* WHAT YOU'LL LEARN – DESKTOP */}
            <div className="hidden lg:block bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">What you'll learn</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {learningOutcomes.map((o, i) => (
                  <div key={i} className="flex gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{o}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* COURSE CONTENT */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-2xl font-bold mb-2 text-gray-800">Course content</h3>
              <p className="text-sm text-gray-600 mb-5">
                {course.modules?.length || 0} modules • {totalChapters} chapters • {course.duration}
              </p>

              <div className="space-y-3">
                {course.modules?.map((mod, idx) => (
                  <div key={mod.moduleId} className="border border-sky-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <button
                      onClick={() => setActiveModule(activeModule === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-4 hover:bg-sky-50 transition"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <Play className="w-5 h-5 text-sky-600" />
                        <div>
                          <h4 className="font-semibold text-gray-800">{mod.moduleTitle}</h4>
                          <p className="text-sm text-gray-600">
                            {mod.chapterCount} {mod.chapterCount === 1 ? "chapter" : "chapters"} • {mod.duration}
                          </p>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-600 transition-transform ${activeModule === idx ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {activeModule === idx && (
                      <div className="border-t border-sky-200 bg-sky-50">
                        <div className="p-4 space-y-3">
                          <p className="text-sm text-gray-700">{mod.description}</p>
                          {mod.chapters?.map((ch) => (
                            <div key={ch.chapterId} className="flex items-center justify-between py-2 pl-8">
                              <div className="flex items-center gap-2">
                                <Play className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{ch.chapterTitle}</span>
                              </div>
                              <span className="text-sm text-gray-500">{ch.duration}</span>
                            </div>
                          ))}
                          {mod.quiz && (
                            <div className="flex items-center gap-2 py-2 pl-8 text-sky-600">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Quiz: {mod.quiz.questions.length} {mod.quiz.questions.length === 1 ? "question" : "questions"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* REVIEWS SECTION */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-2xl font-bold flex items-center gap-2 text-gray-800 mb-6">
                <MessageCircle className="w-6 h-6 text-sky-600" />
                Student Reviews
              </h3>

              {/* Rating summary */}
              {totalReviews > 0 && (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-900">{course.averageRating.toFixed(1)}</div>
                      <div className="flex justify-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < Math.round(course.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Course Rating</p>
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      {ratingCounts.map(({ star, count }) => {
                        const percent = totalReviews ? (count / totalReviews) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-sm">
                            <span className="w-3">{star}</span>
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-400 h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                            </div>
                            <span className="w-12 text-right text-gray-600">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* USER REVIEW */}
              {myReview && (
                <div className="border-l-4 border-sky-600 pl-4 mb-6 bg-sky-50 p-4 rounded-r shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-sky-600 text-white text-xs px-3 py-1 rounded-full font-medium">Your review</span>
                    <div className="flex gap-2">
                      <button onClick={() => openReviewModal(existingReview!)} className="text-sky-600 hover:text-sky-800 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openConfirmModal("Are you sure you want to delete your review?", () => handleDeleteReview(myReview.reviewId))}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <ReviewItem review={myReview} />
                </div>
              )}

              {/* OTHER REVIEWS */}
              {course.reviews.length > 0 && (
                <div className="space-y-6">
                  {course.reviews.map((r) => (
                    <ReviewItem key={r.reviewId} review={r} />
                  ))}
                </div>
              )}

              {/* WRITE A REVIEW BUTTON – WHEN ELIGIBLE BUT NO REVIEW YET */}
              {!myReview && canReview && isStudentLoggedIn() && (
                <div className="mt-8 p-6 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">You've completed this course!</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Your feedback helps others decide. Share your thoughts.
                  </p>
                  <button
                    onClick={() => openReviewModal()}
                    className="px-5 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition shadow-sm"
                  >
                    Write a Review
                  </button>
                </div>
              )}

              {/* NO REVIEWS AT ALL (fallback) */}
              {totalReviews === 0 && !canReview && (
                <p className="text-center text-gray-500 py-8">No reviews yet.</p>
              )}
            </div>
          </div>

          <div className="hidden lg:block"></div>
        </div>
      </section>

      {/* MOBILE BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-sky-200 shadow-2xl z-50">
        <div className="p-4 space-y-3">
          {course.demoVideoUrl && (
            <div className="h-48">
              <DemoVideoPlayer className="h-full" />
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {hasOffer && (
                  <span className="text-lg font-bold text-gray-400 line-through">
                    ₹{course.originalPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-2xl font-bold text-gray-900">
                  ₹{(course.discountedPrice ?? course.originalPrice).toLocaleString()}
                </span>
              </div>
              {hasOffer && <span className="text-xs text-red-600 font-semibold">{discount}% off</span>}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleWishlistToggle}
                className="p-3 border-2 border-gray-900 rounded-xl hover:bg-gray-50 transition"
              >
                <Heart size={20} className={isInWishlist ? "fill-red-500 text-red-500" : "text-gray-900"} />
              </button>

              {isInCart ? (
                <button
                  onClick={() => navigate("/user/cart")}
                  className="px-6 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition whitespace-nowrap"
                >
                  Go to Cart
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="px-6 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition whitespace-nowrap"
                >
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden h-80"></div>

      {/* REVIEW MODAL */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        courseId={courseId!}
        courseTitle={course.courseName}
        completionPercentage={course.completionPercentage || 0}
        onReviewSubmitted={handleReviewSubmitted}
        existingReview={existingReview || undefined}
      />

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Delete Review"
        message={confirmMessage}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
};

const ReviewItem = ({ review }: { review: CourseReview }) => {
  const { username, rating, reviewText, profilePicUrl } = review;
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        {profilePicUrl ? (
          <img
            src={profilePicUrl}
            alt={username}
            className="w-12 h-12 rounded-full object-cover shadow-sm"
            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/48?text=User")}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-800">{username}</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
              />
            ))}
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">{reviewText}</p>
      </div>
    </div>
  );
};

const CourseCard = ({
  course,
  hasOffer,
  discount,
  isInCart,
  isInWishlist,
  onAddToCart,
  onWishlistToggle,
  navigate,
  totalChapters,
  avgRating,
  totalReviews,
  DemoVideoPlayer,
}: CourseCardProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-sky-200 overflow-hidden">
      <div className="h-48">
        <DemoVideoPlayer className="h-full" />
      </div>

      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl font-bold text-gray-900">
              ₹{(course.discountedPrice ?? course.originalPrice).toLocaleString()}
            </span>
            {hasOffer && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  ₹{course.originalPrice.toLocaleString()}
                </span>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>
          {hasOffer && <p className="text-red-600 text-sm font-semibold">Limited time offer!</p>}
        </div>

        {totalReviews > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">
              {avgRating.toFixed(1)} ({totalReviews} reviews)
            </span>
          </div>
        )}

        <div className="space-y-3 mb-4">
          {isInCart ? (
            <button
              onClick={() => navigate("/user/cart")}
              className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition"
            >
              Go to Cart
            </button>
          ) : (
            <button
              onClick={onAddToCart}
              className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition"
            >
              Add to Cart
            </button>
          )}

          <button
            onClick={onWishlistToggle}
            className="w-full py-3 border-2 border-gray-900 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <Heart size={20} className={isInWishlist ? "fill-red-500 text-red-500" : ""} />
            {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          </button>
        </div>

        <div className="border-t border-sky-200 pt-4">
          <h4 className="font-bold mb-3 text-sm text-gray-800">This course includes:</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>{course.duration} on-demand video</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>
                {totalChapters} {totalChapters === 1 ? "chapter" : "chapters"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-600" />
              <span>Access on mobile and desktop</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-600" />
              <span>Certificate of completion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;