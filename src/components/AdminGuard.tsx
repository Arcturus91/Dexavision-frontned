import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, error, refresh } = useProfile();

  const loading = authLoading || profileLoading;

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!profile) return;

    if (profile.role !== "admin") {
      void (async () => {
        await signOut();
        await router.replace("/login?reason=not_admin");
      })();
    }
  }, [loading, profile, router, signOut, user]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (user && !profile) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
        <Stack spacing={1.5} sx={{ maxWidth: 520 }}>
          <Typography variant="h6" fontWeight={900}>
            No se pudo cargar tu perfil
          </Typography>
          <Typography color="text.secondary">
            {error ?? "Intenta nuevamente. Si el problema persiste, revisa el backend."}
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              onClick={() => void refresh()}
              sx={{ textTransform: "none", fontWeight: 800 }}
            >
              Reintentar
            </Button>
            <Button
              variant="outlined"
              onClick={() => void signOut()}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Cerrar sesión
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  if (!user || !profile) return null;
  if (profile.role !== "admin") return null;

  return <>{children}</>;
}

