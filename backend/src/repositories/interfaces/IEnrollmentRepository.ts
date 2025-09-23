// // interfaces/IEnrollmentRepository.ts
// import { IGenericRepository } from "../genericRepository";
// import { IEnrollment } from "../../models/enrollmentModel";

// export interface IEnrollmentRepository
//   extends IGenericRepository<IEnrollment> {}












































import { IGenericRepository } from "../genericRepository";
import { IEnrollment } from "../../models/enrollmentModel";

export interface IEnrollmentRepository extends IGenericRepository<IEnrollment> {
  findByUserId(userId: string): Promise<IEnrollment[]>;
  findByCourseId(courseId: string): Promise<IEnrollment[]>;
  findByUserAndCourse(userId: string, courseId: string): Promise<IEnrollment | null>;
}