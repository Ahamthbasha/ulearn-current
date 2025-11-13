export interface CourseCardProps {
  course: CourseDetail;
  hasOffer: boolean;
  discount: number;
  isInCart: boolean;
  isInWishlist: boolean;
  onAddToCart: () => void;
  onWishlistToggle: () => void;
  navigate: (path: string) => void;
  totalChapters: number;
  avgRating: number;
  totalReviews: number;
  DemoVideoPlayer: React.FC<{ className?: string }>;
}

export interface CourseDetail {
  courseId: string;
  courseName: string;
  instructorName: string;
  instructorId: string;
  categoryName: string;
  thumbnailUrl: string;
  demoVideoUrl: string;
  description: string;
  level: string;
  price: number;
  originalPrice: number;
  discountedPrice?: number;
  duration: string;
  modules: Module[];
  reviews: CourseReview[];
  averageRating: number;
  totalEnrollments: number;
  completionPercentage?: number;
  isEnrolled: boolean;
  userReviewed: boolean;
}

export interface Module {
  moduleId: string;
  moduleTitle: string;
  description: string;
  duration: string;
  position: number;
  chapters: Chapter[];
  chapterCount: number;
  quiz?: Quiz;
}
export interface Chapter {
  chapterId: string;
  chapterTitle: string;
  description: string;
  videoUrl: string;
  duration: string;
  position: number;
}
export interface Quiz {
  quizId: string;
  questions: { questionText: string; options: string[]; correctAnswer: string }[];
}
export interface CourseReview {
  reviewId: string;
  username: string;
  rating: number;
  reviewText: string;
  profilePicUrl?: string;
}
export interface MyReviewFullResponse {
  _id: string;
  courseId: string;
  studentId: string;
  rating: number;
  reviewText: string;
  approved: boolean;
  flaggedByInstructor: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
export interface ModalReviewMin {
  id: string;
  courseId: string;
  studentId: string;
  rating: number;
  reviewText: string;
  completionPercentage: number;
  createdAt: string;
}