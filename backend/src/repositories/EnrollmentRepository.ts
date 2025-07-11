import { IEnrollment, EnrollmentModel } from "../models/enrollmentModel";
import { GenericRepository } from "./genericRepository";

export class EnrollmentRepository extends GenericRepository<IEnrollment> {
  constructor() {
    super(EnrollmentModel);
  }
}