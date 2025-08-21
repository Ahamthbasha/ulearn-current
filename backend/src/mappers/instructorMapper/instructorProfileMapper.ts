import { IInstructor } from "../../models/instructorModel";
import { InstructorProfileDTO } from "../../models/instructorModel";

export const toInstructorProfileDTO = (
  instructor: IInstructor,
  profilePicUrl?: string
): InstructorProfileDTO => {
  return {
    _id:instructor._id,
    instructorName: instructor.username,
    email: instructor.email,
    role:instructor.role,
    isBlocked:instructor.isBlocked,
    skills: instructor.skills,
    expertise: instructor.expertise,
    status: instructor.isVerified,
    mentor: instructor.isMentor,
    bankAccountLinked: !!instructor.bankAccount?.accountNumber,
    profilePicUrl,
  };
};
