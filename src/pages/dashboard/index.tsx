import { Paper, Stack, Typography } from "@mui/material";
import Head from "next/head";
import React from "react";

import { AdminGuard } from "@/components/AdminGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export default function DashboardPage() {
  return (
    <AdminGuard>
      <Head>
        <title>DexaVision | Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardLayout>
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={900}>
            Dashboard
          </Typography>
          <Paper
            variant="outlined"
            sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.7)" }}
          >
            <Typography fontWeight={800}>Bienvenido</Typography>
            <Typography color="text.secondary">
              Selecciona una opción del menú lateral.
            </Typography>
          </Paper>
        </Stack>
      </DashboardLayout>
    </AdminGuard>
  );
}

