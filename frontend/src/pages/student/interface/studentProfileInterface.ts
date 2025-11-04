export interface ProfileData {
  username: string;
  email: string;
  profilePicUrl?: string;
  skills?: string[];
  expertise?: string[];
  currentStatus?: string;
}

export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}