import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  courseDetail,
  getCart,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  isItemInWishlist,
} from "../../../api/action/StudentAction";
import { Heart, Play, Clock, Award, CheckCircle, Users, Smartphone, FileText } from "lucide-react";
import { isStudentLoggedIn } from "../../../utils/auth";
import { type CartItemDTO } from "../interface/studentInterface";
import type { ApiError } from "../../../types/interfaces/ICommon";
import { type CourseDetail } from "../interface/studentCourseDetailInterface";

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isInCart, setIsInCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [activeModule, setActiveModule] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await courseDetail(courseId!);
        const courseData = res.data && 'data' in res ? res.data : res;
        setCourse(courseData);

        if (isStudentLoggedIn()) {
          const [cartRes, wishRes] = await Promise.all([
            getCart(),
            isItemInWishlist(courseId!, "course")
          ]);
          setIsInCart(cartRes.some((item: CartItemDTO) => item.itemId === courseId && item.type === "course"));
          setIsInWishlist(wishRes.exists);
        }
      } catch (error) {
        console.error(error);
        const apiError = error as ApiError;
        toast.error(apiError.response?.data?.message || apiError.message || "Failed to fetch course details");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchData();
  }, [courseId]);

  const handleAddToCart = async () => {
    if (!isStudentLoggedIn()) {
      toast.info("Please log in to add to cart");
      return;
    }

    try {
      await addToCart(courseId!, "course");
      toast.success("Course added to cart");
      setIsInCart(true);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.response?.status === 409) {
        toast.info("Course is already in cart");
        setIsInCart(true);
      } else {
        toast.error(apiError.response?.data?.message || apiError.message || "Failed to add to cart");
      }
    }
  };

  const handleWishlistToggle = async () => {
    if (!isStudentLoggedIn()) {
      toast.info("Please log in to manage your wishlist");
      return;
    }

    try {
      if (!courseId) return;

      if (isInWishlist) {
        const response = await removeFromWishlist(courseId, "course");
        toast.success(response.message || "Removed from wishlist");
        setIsInWishlist(false);
      } else {
        const response = await addToWishlist(courseId, "course");
        toast.success(response.message || "Added to wishlist");
        setIsInWishlist(true);
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.response?.data?.message || apiError.message || "Wishlist operation failed");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h2>
          <button
            onClick={() => navigate('/courses')}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Browse all courses
          </button>
        </div>
      </div>
    );
  }

  const hasOffer = course.discountedPrice !== undefined && course.originalPrice > course.discountedPrice;
  const discount = hasOffer ? Math.round(((course.originalPrice - course.discountedPrice!) / course.originalPrice) * 100) : 0;

  // Calculate total chapters and quiz questions dynamically
  const totalChapters = course.modules?.reduce((acc, module) => acc + module.chapterCount, 0) || 0;
  // const totalQuizQuestions = course.modules?.reduce((acc, module) => 
  //   acc + (module.quiz?.questions.length || 0), 0
  // ) || 0;

  // Generate learning outcomes dynamically from modules
  const learningOutcomes = course.modules?.slice(0, 4).map(module => 
    module.description || `Learn ${module.moduleTitle}`
  ) || [];

  // If we have less than 4 outcomes, add generic ones
  while (learningOutcomes.length < 4) {
    learningOutcomes.push(`Master ${course.courseName} concepts`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Dark Background */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Left Content - Course Info */}
            <div className="lg:col-span-2">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-purple-400 mb-4">
                <span className="hover:underline cursor-pointer">{course.categoryName}</span>
                <span>›</span>
                <span>{course.courseName}</span>
              </div>

              {/* Course Title */}
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">{course.courseName}</h1>

              {/* Course Description */}
              <p className="text-lg text-gray-300 mb-6">{course.description}</p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                    {course.level}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>by {course.instructorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration} total</span>
                </div>
              </div>

              {/* What you'll learn - Mobile */}
              <div className="lg:hidden bg-white text-gray-900 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">What you'll learn</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {learningOutcomes.map((outcome, index) => (
                    <div key={index} className="flex gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Course Card (Desktop Sticky) */}
            <div className="hidden lg:block">
              <div className="sticky top-4">
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
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* What you'll learn - Desktop */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-2xl font-bold mb-4">What you'll learn</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {learningOutcomes.map((outcome, index) => (
                  <div key={index} className="flex gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Content */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-2xl font-bold mb-2">Course content</h3>
              <p className="text-sm text-gray-600 mb-4">
                {course.modules?.length || 0} modules • {totalChapters} chapters • {course.duration} total length
              </p>

              <div className="space-y-2">
                {course.modules?.map((module, index) => (
                  <div key={module.moduleId} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setActiveModule(activeModule === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <Play className="w-5 h-5 text-gray-600" />
                        <div>
                          <h4 className="font-semibold">{module.moduleTitle}</h4>
                          <p className="text-sm text-gray-600">
                            {module.chapterCount} {module.chapterCount === 1 ? 'chapter' : 'chapters'} • {module.duration}
                          </p>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-600 transition-transform ${activeModule === index ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {activeModule === index && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        <div className="p-4 space-y-3">
                          <p className="text-sm text-gray-700 mb-3">{module.description}</p>
                          {module.chapters?.map((chapter) => (
                            <div key={chapter.chapterId} className="flex items-center justify-between py-2 pl-8">
                              <div className="flex items-center gap-2">
                                <Play className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{chapter.chapterTitle}</span>
                              </div>
                              <span className="text-sm text-gray-500">{chapter.duration}</span>
                            </div>
                          ))}
                          {module.quiz && (
                            <div className="flex items-center gap-2 py-2 pl-8 text-purple-600">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Quiz: {module.quiz.questions.length} {module.quiz.questions.length === 1 ? 'question' : 'questions'}
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

            {/* Requirements */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-2xl font-bold mb-4">Requirements</h3>
              <ul className="space-y-2">
                <li className="flex gap-2 text-sm">
                  <span className="text-gray-600">•</span>
                  <span>No prior programming knowledge required</span>
                </li>
                <li className="flex gap-2 text-sm">
                  <span className="text-gray-600">•</span>
                  <span>A computer with internet access</span>
                </li>
                <li className="flex gap-2 text-sm">
                  <span className="text-gray-600">•</span>
                  <span>Enthusiasm to learn</span>
                </li>
              </ul>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-2xl font-bold mb-4">Description</h3>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>{course.description}</p>
                {course.modules && course.modules.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Course Modules:</h4>
                    <ul className="space-y-2">
                      {course.modules.map((module, index) => (
                        <li key={module.moduleId} className="flex gap-2">
                          <span className="text-purple-600 font-medium">{index + 1}.</span>
                          <div>
                            <span className="font-medium">{module.moduleTitle}</span>
                            <span className="text-gray-600"> - {module.description}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Instructor */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-2xl font-bold mb-4">Instructor</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {course.instructorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-purple-600 hover:text-purple-700 cursor-pointer">
                    {course.instructorName}
                  </h4>
                  <p className="text-gray-600 text-sm">Course Instructor</p>
                  <p className="text-gray-600 text-sm mt-2">
                    Teaching {course.categoryName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Spacer for desktop sticky sidebar */}
          <div className="hidden lg:block"></div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
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
            {hasOffer && (
              <span className="text-xs text-red-600 font-semibold">{discount}% off</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWishlistToggle}
              className="p-3 border-2 border-gray-900 rounded-lg hover:bg-gray-50"
            >
              <Heart
                size={20}
                className={isInWishlist ? "fill-red-500 text-red-500" : "text-gray-900"}
              />
            </button>
            {isInCart ? (
              <button
                onClick={() => navigate("/user/cart")}
                className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 whitespace-nowrap"
              >
                Go to Cart
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 whitespace-nowrap"
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for mobile fixed bar */}
      <div className="lg:hidden h-20"></div>
    </div>
  );
};

// Course Card Component for Desktop Sidebar
interface CourseCardProps {
  course: CourseDetail;
  hasOffer: boolean;
  discount: number;
  isInCart: boolean;
  isInWishlist: boolean;
  onAddToCart: () => void;
  onWishlistToggle: () => void;
  navigate: (path: string) => void;
  totalChapters: number;
}

const CourseCard = ({ 
  course, 
  hasOffer, 
  discount, 
  isInCart, 
  isInWishlist, 
  onAddToCart, 
  onWishlistToggle, 
  navigate,
  totalChapters 
}: CourseCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Video Preview */}
      <div className="relative">
        <img
          src={course.thumbnailUrl}
          alt={course.courseName}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Course+Thumbnail';
          }}
        />
        {course.demoVideoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <div className="w-16 h-16 rounded-full bg-white bg-opacity-90 flex items-center justify-center cursor-pointer hover:bg-opacity-100 transition">
              <Play className="w-8 h-8 text-gray-900 ml-1" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Price */}
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
          {hasOffer && (
            <p className="text-red-600 text-sm font-semibold">Limited time offer!</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-4">
          {isInCart ? (
            <button
              onClick={() => navigate("/user/cart")}
              className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition"
            >
              Go to Cart
            </button>
          ) : (
            <button
              onClick={onAddToCart}
              className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition"
            >
              Add to Cart
            </button>
          )}
          <button
            onClick={onWishlistToggle}
            className="w-full py-3 border-2 border-gray-900 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <Heart
              size={20}
              className={isInWishlist ? "fill-red-500 text-red-500" : ""}
            />
            {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          </button>
        </div>

        {/* Course Includes */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-bold mb-3 text-sm">This course includes:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span>{course.duration} on-demand video</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span>{totalChapters} {totalChapters === 1 ? 'chapter' : 'chapters'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gray-600" />
              <span>Access on mobile and desktop</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-gray-600" />
              <span>Certificate of completion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;