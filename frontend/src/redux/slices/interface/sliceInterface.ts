export interface InstructorSlice {
  userId: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  isBlocked: string | null;
  isVerified: boolean | null; 
  profilePicture: string | null;
}

export interface UserSlice {
  userId: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  isBlocked: string | null;
  profilePicture: string | null;
}