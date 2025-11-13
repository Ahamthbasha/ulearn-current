import { IStudentCourseService } from "./interface/IStudentCourseService";
import { IStudentCourseRepository } from "../../repositories/studentRepository/interface/IStudentCourseRepository";
import { IStudentModuleRepository } from "../../repositories/studentRepository/interface/IStudentModuleRepository";
import { CourseDetailDTO, IReviewDTO } from "../../dto/userDTO/courseDetailDTO";
import { mapCourseToDetailDTO } from "../../mappers/userMapper/mapCourseToDetailDTO";
import { ICourseFullyPopulated } from "../../models/courseModel";
import { IStudentCourseReviewRepo } from "../../repositories/studentRepository/interface/IStudentCourseReviewRepo";
import { ICourseReview } from "../../models/courseReviewModel";
import {Types} from "mongoose"
import { IEnrollmentRepository } from "../../repositories/interfaces/IEnrollmentRepository";

export class StudentCourseService implements IStudentCourseService {
  private _studentCourseRepo: IStudentCourseRepository;
  private _studentModuleRepo: IStudentModuleRepository;
  private _studentCourseReviewRepo : IStudentCourseReviewRepo
  private _enrollmentRepo : IEnrollmentRepository
  constructor(
    studentCourseRepo: IStudentCourseRepository,
    studentModuleRepo: IStudentModuleRepository,
    studentCourseReviewRepo : IStudentCourseReviewRepo,
    enrollmentRepo : IEnrollmentRepository
  ) {
    this._studentCourseRepo = studentCourseRepo;
    this._studentModuleRepo = studentModuleRepo;
    this._studentCourseReviewRepo = studentCourseReviewRepo
    this._enrollmentRepo = enrollmentRepo
  }


  async getAllCoursesWithDetails(): Promise<CourseDetailDTO[]> {
  // Fetch all listed courses with instructor and category populated
  const rawCourses = await this._studentCourseRepo.getAllListedCourses();

  const dtos: CourseDetailDTO[] = [];

  for (const { course } of rawCourses) {
    const populatedCourse = course as ICourseFullyPopulated;

    // Fetch modules for each course
    const modules = await this._studentModuleRepo.getModulesByCourseId(
      course._id.toString()
    );

    // ✅ Fetch all approved reviews for this course (with student username)
    const reviewsData = (await this._studentCourseReviewRepo.getReviewsByCourse(
      course._id.toString()
    )) as unknown as Array<
      Omit<ICourseReview, "studentId"> & {
        studentId: { _id: Types.ObjectId; username: string };
      }
    >;

    // Map reviews into DTO
    const reviews: IReviewDTO[] = reviewsData.map((r) => ({
      reviewId: String(r._id),
      username: r.studentId?.username ?? "Anonymous",
      rating: r.rating,
      reviewText: r.reviewText,
    }));
    

    // ✅ Pass all 4 arguments to mapper
    const dto = mapCourseToDetailDTO(
      populatedCourse,
      modules,
      reviews,
    );

    dtos.push(dto);
  }

  return dtos;
}


async getFilteredCoursesWithDetails(
  page: number,
  limit: number,
  searchTerm = "",
  sort: "name-asc" | "name-desc" | "price-asc" | "price-desc" = "name-asc",
  categoryId?: string,
): Promise<{ data: CourseDetailDTO[]; total: number }> {
  // Fetch paginated, filtered courses
  const result = await this._studentCourseRepo.getFilteredCourses(
    page,
    limit,
    searchTerm,
    sort,
    categoryId,
  );

  const dtos: CourseDetailDTO[] = [];

  for (const { course } of result.data) {
    const populatedCourse = course as ICourseFullyPopulated;

    // ✅ Fetch modules for the course
    const modules = await this._studentModuleRepo.getModulesByCourseId(
      course._id.toString()
    );

    // ✅ Fetch all approved reviews (ensure student username is populated)
    const reviewsData = (await this._studentCourseReviewRepo.getReviewsByCourse(
      course._id.toString()
    )) as unknown as Array<
      Omit<ICourseReview, "studentId"> & {
        studentId: { _id: Types.ObjectId; username: string };
      }
    >;

    // Map reviews into DTO format
    const reviews: IReviewDTO[] = reviewsData.map((r) => ({
      reviewId: String(r._id),
      username: r.studentId?.username ?? "Anonymous",
      rating: r.rating,
      reviewText: r.reviewText,
    }));

    // ✅ Pass all 4 arguments consistently
    const dto = mapCourseToDetailDTO(
      populatedCourse,
      modules,
      reviews,
    );

    dtos.push(dto);
  }

  return { data: dtos, total: result.total };
}

async getCourseDetailsById(
  courseId: string,
  studentId?: string
): Promise<CourseDetailDTO | null> {
  const raw = await this._studentCourseRepo.getCourseDetails(courseId);
  if (!raw.course) return null;

  type PopulatedReview = Omit<ICourseReview, "studentId"> & {
    studentId: { _id: Types.ObjectId; username: string; profilePicUrl?: string };
  };

  // 1. Get ALL public reviews (approved + not deleted)
  const allReviewsData = (await this._studentCourseReviewRepo.getReviewsByCourse(
    courseId
  )) as PopulatedReview[];

  let reviews: IReviewDTO[] = [];
  let userReviewed = false;

  if (studentId) {
    // 2. Check if current student has reviewed
    const existingReview = await this._studentCourseReviewRepo.findOne({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
    });
    userReviewed = !!existingReview;

    // 3. Filter out current student's review from public list
    const studentObjId = new Types.ObjectId(studentId);
    reviews = allReviewsData
      .filter((r) => !r.studentId._id.equals(studentObjId))
      .map((r) => ({
        reviewId: String(r._id),
        username: r.studentId?.username ?? "Anonymous",
        rating: r.rating,
        reviewText: r.reviewText,
        profilePicUrl: r.studentId?.profilePicUrl,
      }));
  } else {
    // 4. No student → return all reviews
    reviews = allReviewsData.map((r) => ({
      reviewId: String(r._id),
      username: r.studentId?.username ?? "Anonymous",
      rating: r.rating,
      reviewText: r.reviewText,
      profilePicUrl: r.studentId?.profilePicUrl,
    }));
  }

  const modules = await this._studentModuleRepo.getModulesByCourseId(courseId);
  const totalEnrollments = await this._enrollmentRepo.countByCourseId(courseId);

  let isEnrolled = false;
  let completionPercentage: number | undefined;

  if (studentId) {
    isEnrolled = await this._enrollmentRepo.isCourseEnrolledByStudent(courseId, studentId);
    const enrollment = await this._enrollmentRepo.findByUserAndCourse(studentId, courseId);
    completionPercentage = enrollment?.completionPercentage;
  }

  const dto = mapCourseToDetailDTO(
    raw.course,
    modules,
    reviews,
    totalEnrollments,
    completionPercentage,
    isEnrolled,
    userReviewed
  );

  return dto;
}

  async getCourseRaw(courseId: string) {
    return this._studentCourseRepo.getCourseDetails(courseId);
  }

  async getCourses(categoryId?: string) {
    return this._studentCourseRepo.getCourses(categoryId);
  }

}