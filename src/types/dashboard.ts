export type DashboardPeriod = "30" | "90" | "180" | string;

export type PendingDoctor = {
  userId: string;
  displayName: string;
  email: string;
  displayEmail: string;
  profileStatus: string;
  submittedAt: string;
};

export type DashboardStatsResponse = {
  success: boolean;
  data: {
    period: DashboardPeriod;
    cards: {
      activeUsers: number;
      activeDoctors: number;
      pendingVerifications: number;
    };
    userCounts: {
      total: number;
      patients: number;
      doctors: number;
      admins: number;
    };
    doctorStatusCounts: Record<string, number>;
    userGrowth: Array<{ label: string; count: number }>;
    pendingDoctors: PendingDoctor[];
  };
};

