// interfaces/IEnrollmentRepository.ts
import { IGenericRepository } from "../genericRepository";
import { IEnrollment } from "../../models/enrollmentModel";

export interface IEnrollmentRepository extends IGenericRepository<IEnrollment> {}
