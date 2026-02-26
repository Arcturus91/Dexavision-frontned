export type DoctorProfileStatus =
  | "incomplete"
  | "in_review"
  | "approved"
  | "rejected"
  | string;

export type Doctor = {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  displayEmail: string;
  professionalName: string;
  profileStatus: DoctorProfileStatus;
  submittedAt: string | null;
};

export type DocumentUrl = {
  key: string;
  url: string;
  type:
    | "certificado_superintendencia_salud"
    | "registro_sanitario"
    | "certificado_profesional"
    | string;
};

export type DoctorDetail = Doctor & {
  documentUrls: DocumentUrl[];
  phone: string;
  address: string;
  tags: string[];
  availability: Record<
    string,
    { available: boolean; start: string; end: string }
  >;
  reviewMessage: string;
  reviewedAt: string | null;
  reviewedBy: string;
};

export type DoctorDetailResponse = {
  success: boolean;
  data: DoctorDetail;
};

export type DoctorsResponse = {
  success: boolean;
  data: {
    doctors: Doctor[];
    pagination?: {
      afterCursor: string | null;
      beforeCursor: string | null;
      pageSize: number; // backend echo, but request param is `limit`
    };
    counts?: {
      incomplete: number;
      in_review: number;
      approved: number;
      rejected: number;
    };
  };
};

