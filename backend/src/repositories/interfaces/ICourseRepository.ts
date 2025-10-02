import { IGenericRepository } from "../genericRepository";
import { ICourse } from "../../models/courseModel";

export interface ICourseRepository extends IGenericRepository<ICourse> {
    removeOffer(courseId: string): Promise<ICourse | null>;
}
