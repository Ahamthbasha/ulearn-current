import { Types } from "mongoose";
import { ILearningPathEnrollment } from "../../models/learningPathEnrollmentModel";
import { ICourse } from "../../models/courseModel";
import { IStudentLmsEnrollmentRepo } from "../../repositories/studentRepository/interface/IStudentLmsEnrollmentRepo";
import { IStudentLmsEnrollmentService } from "./interface/IStudentLmsEnrollmentService";
import { IStudentEnrollmentRepository } from "../../repositories/studentRepository/interface/IStudentEnrollmentRepository";
import {
  LearningPathDTO,
  LearningPathDetailsDTO,
} from "../../dto/userDTO/lmsEnrollDTO";
import {
  mapToLearningPathDTO,
  mapToLearningPathDetailsDTO,
} from "../../mappers/userMapper/lmsEnrollMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { IOrderRepository } from "../../repositories/interfaces/IOrderRepository";

export class StudentLmsEnrollmentService
  implements IStudentLmsEnrollmentService
{
  private _studentLmsEnrollmentRepo: IStudentLmsEnrollmentRepo;
  private _enrollmentRepo: IStudentEnrollmentRepository;
  private _orderRepository: IOrderRepository;

  constructor(
    studentLmsEnrollmentRepo: IStudentLmsEnrollmentRepo,
    enrollmentRepo: IStudentEnrollmentRepository,
    orderRepository: IOrderRepository,
  ) {
    this._studentLmsEnrollmentRepo = studentLmsEnrollmentRepo;
    this._enrollmentRepo = enrollmentRepo;
    this._orderRepository = orderRepository;
  }

  async getEnrolledLearningPaths(userId: string): Promise<LearningPathDTO[]> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      const enrolledData =
        await this._studentLmsEnrollmentRepo.getEnrolledLearningPaths(
          userObjectId,
        );
      const learningPaths = await Promise.all(
        enrolledData.map(
          async ({ learningPath, enrollment }) =>
            await mapToLearningPathDTO(
              learningPath,
              enrollment,
              this._orderRepository,
              userObjectId,
            ),
        ),
      );
      return learningPaths;
    } catch (error) {
      throw new Error(`Service error: ${(error as Error).message}`);
    }
  }

  async getLearningPathDetails(
    userId: string,
    learningPathId: string,
  ): Promise<LearningPathDetailsDTO> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      const learningPathObjectId = new Types.ObjectId(learningPathId);
      const { learningPath, enrollment, courses } =
        await this._studentLmsEnrollmentRepo.getLearningPathDetails(
          userObjectId,
          learningPathObjectId,
        );
      return await mapToLearningPathDetailsDTO(
        learningPath,
        enrollment,
        courses,
        this._orderRepository,
        userObjectId,
        getPresignedUrl,
      );
    } catch (error) {
      throw new Error(`Service error: ${(error as Error).message}`);
    }
  }

  async completeCourseAndUnlockNext(
    userId: string,
    learningPathId: string,
    courseId: string,
  ): Promise<ILearningPathEnrollment> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      const learningPathObjectId = new Types.ObjectId(learningPathId);
      const courseObjectId = new Types.ObjectId(courseId);

      const enrollment = await this._enrollmentRepo.findOne({
        userId: userObjectId,
        courseId: courseObjectId,
        learningPathId: learningPathObjectId,
      });

      if (!enrollment) {
        throw new Error("Course enrollment not found");
      }

      const courseDetails =
        await this._studentLmsEnrollmentRepo.getLearningPathDetails(
          userObjectId,
          learningPathObjectId,
        );
      const targetCourse = courseDetails.courses.find((c) =>
        c._id.equals(courseObjectId),
      );
      if (!targetCourse) {
        throw new Error("Course not found in learning path");
      }

      const learningPathEnrollment =
        await this._studentLmsEnrollmentRepo.markCourseCompleted(
          courseDetails.enrollment._id as Types.ObjectId,
          courseObjectId,
        );

      const learningPath = courseDetails.learningPath;
      const currentItem = learningPath.items.find((item) =>
        item.courseId instanceof Types.ObjectId
          ? item.courseId.equals(courseObjectId)
          : (item.courseId as ICourse)._id.equals(courseObjectId),
      );

      if (!currentItem) {
        throw new Error("Course not found in learning path items");
      }

      const nextOrder = currentItem.order + 1;
      const nextItem = learningPath.items.find(
        (item) => item.order === nextOrder,
      );

      if (nextItem && learningPathEnrollment.unlockedOrder < nextOrder) {
        await this._studentLmsEnrollmentRepo.updateUnlockedOrder(
          learningPathEnrollment._id as Types.ObjectId,
          nextOrder,
        );
        learningPathEnrollment.unlockedOrder = nextOrder;
      }

      return learningPathEnrollment;
    } catch (error) {
      throw new Error(`Service error: ${(error as Error).message}`);
    }
  }

  async generateLearningPathCertificate(
    userId: string,
    learningPathId: string,
    studentName: string,
    learningPathTitle: string,
    instructorName: string,
  ): Promise<string> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      const learningPathObjectId = new Types.ObjectId(learningPathId);
      const enrollment =
        await this._studentLmsEnrollmentRepo.getLearningPathDetails(
          userObjectId,
          learningPathObjectId,
        );
      if (!enrollment) {
        throw new Error("Learning path enrollment not found");
      }
      const certificateUrl =
        await this._studentLmsEnrollmentRepo.generateLearningPathCertificate(
          enrollment.enrollment._id as Types.ObjectId,
          studentName,
          learningPathTitle,
          instructorName,
        );
      return certificateUrl;
    } catch (error) {
      throw new Error(`Service error: ${(error as Error).message}`);
    }
  }
}
