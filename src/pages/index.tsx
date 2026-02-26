import { Box, CircularProgress } from "@mui/material";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";

export default function IndexPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    void router.replace(user ? "/dashboard" : "/login");
  }, [loading, router, user]);

  return (
    <>
      <Head>
        <title>DexaVision</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    </>
  );
}
