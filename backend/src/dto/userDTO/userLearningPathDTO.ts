export interface LearningPathListDTOUSER {
  learningPathId: string;
  title: string;
  description: string;
  noOfCourses: number;
  hoursOfCourses: number;
  thumbnailUrl: string;
  totalPrice: number;
  categoryId: string;
  categoryName: string;
}


export interface LearningPathDetailDTO {
  learningPathId: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  noOfCourses: number;
  hoursOfCourses: number;
  courses: { courseId: string; courseName: string }[];
  learningPathThumbnailUrl: string;
  categoryId: string;
  categoryName: string;
  totalPrice: number;
}