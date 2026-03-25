export type UserRole = "patient" | "doctor" | "admin" | string;

export type AccountStatus = "active" | "suspended" | "blocked" | string;

export type AdminUser = {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountStatus?: AccountStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersResponse = {
  success: boolean;
  data: {
    users: AdminUser[];
    pagination?: {
      afterCursor: string | null;
      beforeCursor: string | null;
      pageSize: number;
    };
  };
};

export type BasicUserDetail = {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountStatus?: AccountStatus;
  statusChangeReason?: string | null;
  createdAt: string;
  updatedAt: string;
  profilePictureUrl?: string | null;
};

export type PatientDetail = BasicUserDetail & {
  role: "patient";
  address: string;
  age: number;
  alcohol: string;
  allergies: string;
  brushCount: number;
  diseases: string;
  gender: string;
  phone: string;
  pregnant?: boolean;
  smoke: string;
  lastDental?: string;
};

export type AdminUserDetailResponse = {
  success: boolean;
  data: unknown; // runtime discriminated (doctor vs others)
};
