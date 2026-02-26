import { Box, CircularProgress } from "@mui/material";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) return;

    const next =
      typeof router.asPath === "string" && router.asPath !== "/login"
        ? router.asPath
        : "/dashboard";
    void router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [loading, router, user]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}

