// interfaces/ICourseRepository.ts
import { IGenericRepository } from "../genericRepository";
import { ICourse } from "../../models/courseModel";

export interface ICourseRepository extends IGenericRepository<ICourse> {}
