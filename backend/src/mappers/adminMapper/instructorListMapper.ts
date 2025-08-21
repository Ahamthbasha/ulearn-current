// src/mappers/instructorMapper.ts
import { InstructorDTO } from "../../dto/adminDTO/instructorListDTO";
import { IInstructor } from "../../models/instructorModel";

export const mapInstructorToDTO = (instructor: IInstructor): InstructorDTO => {
  return {
    id: instructor._id.toString(),
    name: instructor.username,
    email: instructor.email,
    status: instructor.isBlocked,
    createdAt: new Date(instructor.createdAt).toLocaleDateString("en-GB"),
  };
};

export const mapInstructorsToDTO = (instructors: IInstructor[]): InstructorDTO[] => {
  return instructors.map(mapInstructorToDTO);
};
