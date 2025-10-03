import { IGenericRepository } from "../genericRepository";
import { ICourse } from "../../models/courseModel";

export interface ICourseRepository extends IGenericRepository<ICourse> {
    removeOffer(courseId: string): Promise<ICourse | null>;
    updateById(courseId: string, data: Partial<ICourse>): Promise<ICourse | null>;
}