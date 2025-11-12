import { Types } from "mongoose";
import { ILearningPathEnrollment } from "../../models/learningPathEnrollmentModel";
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
      );
    } catch (error) {
      throw new Error(`${(error as Error).message}`);
    }
  }

async completeCourseAndUnlockNext(
  userId: string,
  learningPathId: string,
  courseId: string,
): Promise<ILearningPathEnrollment> {
  try {
    const userObjId = new Types.ObjectId(userId);
    const lpObjId = new Types.ObjectId(learningPathId);
    const courseObjId = new Types.ObjectId(courseId);

    // 1. Ensure course enrollment exists
    const courseEnrollment = await this._enrollmentRepo.findOne({
      userId: userObjId,
      courseId: courseObjId,
      learningPathId: lpObjId,
    });
    if (!courseEnrollment) {
      throw new Error("Course enrollment not found for this learning path");
    }

    // 2. Get LP enrollment ID
    const { enrollment: lpEnrollment } =
      await this._studentLmsEnrollmentRepo.getLearningPathDetails(
        userObjId,
        lpObjId,
      );

    // 3. Mark course completed → **Unlocking happens automatically via sync**
    const updatedLpEnrollment =
      await this._studentLmsEnrollmentRepo.markCourseCompleted(
        lpEnrollment._id as Types.ObjectId,
        courseObjId,
      );

    // 4. Trigger runtime sync to ensure next course is unlocked
    await this._studentLmsEnrollmentRepo.getLearningPathDetails(
      userObjId,
      lpObjId,
    );

    return updatedLpEnrollment;
  } catch (error) {
    throw new Error(`${(error as Error).message}`);
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
      throw new Error(`${(error as Error).message}`);
    }
  }
}
