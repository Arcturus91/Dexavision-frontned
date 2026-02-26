export type UserRole = "admin" | string; //avoid magic strings

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
