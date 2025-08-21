import { IUser } from "../../models/userModel";
import { StudentProfileDTO } from "../../dto/userDTO/studentProfileDTO"; 

export const toStudentProfileDTO = (
  user: IUser,
  profilePicUrl?: string
): StudentProfileDTO => {
  return {
    username: user.username,
    email: user.email,
    skills: user.skills || [],
    expertise: user.expertise || [],
    profilePicUrl: profilePicUrl || user.profilePicUrl,
    currentStatus: user.currentStatus,
  };
};
