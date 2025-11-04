export interface ProfileFormValues {
  name: string;
  skills: string;
  expertise: string;
  profilePic: File | null;
}

export interface InstructorProfile {
  instructorName?: string;
  skills?: string[];
  expertise?: string[];
  profilePicUrl?: string;
}

export interface ProfileResponse {
  success: boolean;
  data: InstructorProfile;
}

export interface UpdateProfileResponse {
  success: boolean;
  data: {
    _id: string;
    username: string;
    email: string;
    role: string;
    isBlocked: boolean;
    isVerified: boolean;
    profilePicUrl?: string;
  };
}