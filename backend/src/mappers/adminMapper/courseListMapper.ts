// src/mappers/courseMapper.ts
import { ICourse } from "../../models/courseModel";
import { ICourseDTO } from "../../dto/adminDTO/courseListDTO"; 

export const mapCoursesToDTO = (courses: ICourse[]): ICourseDTO[] => {
  return courses.map((course) => ({
    courseId: course._id.toString(),
    courseName: course.courseName,
    isListed: course.isListed,
    isVerified:course.isVerified
  }));
};
