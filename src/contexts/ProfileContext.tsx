import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import type { ProfileData, ProfileResponse } from "@/types/profile";

type ProfileContextValue = {
  profile: ProfileData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

function isProfileResponse(value: unknown): value is ProfileResponse {
  if (!value || typeof value !== "object") return false;
  const v = value as { success?: unknown; data?: unknown };
  if (typeof v.success !== "boolean") return false;
  if (!v.data || typeof v.data !== "object") return false;
  const d = v.data as Record<string, unknown>;
  return (
    typeof d.displayName === "string" &&
    typeof d.email === "string" &&
    typeof d.role === "string" &&
    typeof d.userId === "string"
  );
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, getIdToken } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("No hay token de Firebase disponible.");

      const resp = await fetch("/api/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = resp.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json")
        ? await resp.json()
        : await resp.text();

      if (!resp.ok) {
        throw new Error(
          typeof body === "string"
            ? body
            : `Error ${resp.status}: ${JSON.stringify(body)}`,
        );
      }

      if (!isProfileResponse(body)) {
        throw new Error("Respuesta inesperada de /profile.");
      }

      setProfile(body.data);
    } catch (err) {
      setProfile(null);
      setError(err instanceof Error ? err.message : "Error cargando perfil");
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }
    void fetchProfile();
  }, [authLoading, fetchProfile, user]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      error,
      refresh: fetchProfile,
    }),
    [error, fetchProfile, loading, profile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx)
    throw new Error("useProfile debe usarse dentro de <ProfileProvider />");
  return ctx;
}
