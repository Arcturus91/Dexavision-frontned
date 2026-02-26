import { Paper, Stack, Typography } from "@mui/material";
import Head from "next/head";
import React from "react";

import { AdminGuard } from "@/components/AdminGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export default function UsuariosPage() {
  return (
    <AdminGuard>
      <Head>
        <title>DexaVision | Usuarios</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardLayout>
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={900}>
            Usuarios
          </Typography>
          <Paper
            variant="outlined"
            sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.7)" }}
          >
            <Typography color="text.secondary">Pendiente.</Typography>
          </Paper>
        </Stack>
      </DashboardLayout>
    </AdminGuard>
  );
}

