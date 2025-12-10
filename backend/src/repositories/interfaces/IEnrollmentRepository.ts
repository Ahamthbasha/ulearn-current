import { IGenericRepository } from "../genericRepository";
import { IEnrollment } from "../../models/enrollmentModel";
import mongoose, { PopulateOptions, Types } from "mongoose";

export interface IEnrollmentRepository extends IGenericRepository<IEnrollment> {
  findByUserId(userId: string): Promise<IEnrollment[]>;
  findByCourseId(courseId: string): Promise<IEnrollment[]>;
  findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<IEnrollment | null>;
  findByUserAndCourseWithPopulate(
    userId: string,
    courseId: string,
    populateOptions: PopulateOptions[],
  ): Promise<IEnrollment | null>;
  createMany(enrollments: Partial<IEnrollment>[]): Promise<IEnrollment[]>;
  createManyWithSession(
    enrollments: Partial<IEnrollment>[],
    session: mongoose.ClientSession,
  ): Promise<IEnrollment[]>;
  findByUserAndCoursesWithSession(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    session: mongoose.ClientSession,
  ): Promise<IEnrollment[]>;
  updateEnrollmentWithSession(
    enrollmentId: Types.ObjectId,
    updates: Partial<IEnrollment>,
    session: mongoose.ClientSession,
  ): Promise<IEnrollment | null>;
  countByCourseId(courseId:string):Promise<number>

  isCourseEnrolledByStudent(courseId:string,studentId:string):Promise<boolean>
}
