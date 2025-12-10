export interface IReviewDTO{
  reviewId:string;
  username:string;
  rating:number;
  reviewText:string;
  profilePicUrl?:string;
}
export interface IChapterDTO {
  chapterId: string;
  chapterTitle: string;
  description: string;
  videoUrl: string;
  duration: string;
  position: number;
}

export interface IQuizDTO {
  quizId: string;
  questions: {
    questionText: string;
    options: string[];
    correctAnswer: string;
  }[];
}

export interface IModuleDTO {
  moduleId: string;
  moduleTitle: string;
  description: string;
  position: number;
  duration: string;
  chapters: IChapterDTO[];
  chapterCount:number;
  quiz?: IQuizDTO;
}

export interface CourseDetailDTO {
  courseId: string;
  courseName: string;
  instructorName: string;
  instructorId:string;
  categoryName: string;
  thumbnailUrl: string;
  demoVideoUrl: string;
  description: string;
  level: string;
  price: number;
  originalPrice: number;
  discountedPrice?: number;
  duration: string;         
  modules: IModuleDTO[];
  reviews:IReviewDTO[];
  averageRating:number;
  totalEnrollments:number;
  completionPercentage?:number;
  isEnrolled:boolean;
  userReviewed:boolean;
}