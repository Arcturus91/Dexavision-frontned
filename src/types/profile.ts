export type UserRole = "admin" | string;

export type ProfileData = {
  displayName: string;
  email: string;
  profilePicture?: string | null;
  role: UserRole;
  userId: string;
};

export type ProfileResponse = {
  success: boolean;
  data: ProfileData;
};
