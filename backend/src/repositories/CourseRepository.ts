import { ICourse,CourseModel } from "../models/courseModel";

import { GenericRepository } from "./genericRepository";

export class CourseRepository extends GenericRepository<ICourse>{
    constructor(){
        super(CourseModel)
    }
}