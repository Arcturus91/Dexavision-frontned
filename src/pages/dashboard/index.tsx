/* eslint-disable @typescript-eslint/no-explicit-any */
import { Icon } from "@iconify/react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Head from "next/head";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { AdminGuard } from "@/components/AdminGuard";
import { DashboardKpiCard } from "@/components/dashboard/DashboardKpiCard";
import { UserGrowthChart } from "@/components/dashboard/UserGrowthChart";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import type {
  DashboardPeriod,
  DashboardStatsResponse,
  PendingDoctor,
} from "@/types/dashboard";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function statusChip(status: string) {
  switch (status) {
    case "in_review":
      return { label: "Pendiente", bg: "#E7F3FF", fg: "#2B7CCB" };
    case "incomplete":
      return { label: "Corrección necesaria", bg: "#FFF1D6", fg: "#F5A623" };
    case "approved":
      return { label: "Aprobado", bg: "#E6F7EA", fg: "#2E7D32" };
    case "rejected":
      return { label: "Rechazado", bg: "#FFE6E6", fg: "#D32F2F" };
    default:
      return { label: status, bg: "rgba(0,0,0,0.06)", fg: "rgba(0,0,0,0.72)" };
  }
}

export default function DashboardPage() {
  const { getIdToken } = useAuth();

  const [period, setPeriod] = useState<DashboardPeriod>("90");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardStatsResponse["data"] | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("No hay token de Firebase disponible.");

      const resp = await fetch(
        `/api/admin/dashboard/stats?period=${encodeURIComponent(String(period))}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const body = (await resp.json().catch(() => null)) as unknown;
      if (!resp.ok) throw new Error("No se pudieron cargar las estadísticas.");
      const parsed = body as DashboardStatsResponse;
      if (!parsed?.data) throw new Error("Respuesta inesperada del servidor.");
      setData(parsed.data);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [getIdToken, period]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const pendingDoctors = useMemo<PendingDoctor[]>(
    () => data?.pendingDoctors ?? [],
    [data],
  );

  return (
    <AdminGuard>
      <Head>
        <title>DexaVision | Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardLayout>
        <Stack spacing={2.25}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.25}>
              <Typography variant="h5" fontWeight={900}>
                Dashboard General
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resumen de actividades y rendimiento de la plataforma
              </Typography>
            </Stack>

            <Paper
              variant="outlined"
              sx={{
                p: 0.5,
                borderRadius: 999,
                borderColor: "rgba(15, 23, 42, 0.10)",
                bgcolor: "#fff",
              }}
            >
              <Stack direction="row" spacing={0.5}>
                {(
                  [
                    ["30", "30 días"],
                    ["90", "90 días"],
                    ["180", "180 días"],
                  ] as Array<[DashboardPeriod, string]>
                ).map(([p, label]) => (
                  <Button
                    key={String(p)}
                    size="small"
                    onClick={() => setPeriod(p)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 900,
                      borderRadius: 999,
                      px: 2,
                      color: period === p ? "text.primary" : "text.secondary",
                      bgcolor:
                        period === p ? "rgba(15, 23, 42, 0.06)" : "transparent",
                      "&:hover": {
                        bgcolor:
                          period === p
                            ? "rgba(15, 23, 42, 0.08)"
                            : "rgba(15, 23, 42, 0.04)",
                      },
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Stack>
            </Paper>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            <DashboardKpiCard
              title="Usuarios Activos"
              value={data?.cards.activeUsers ?? null}
              icon="mdi:users"
              variant="filled"
            />
            <DashboardKpiCard
              title="Profesionales Activos Registrados"
              value={data?.cards.activeDoctors ?? null}
              icon="healthicons:health-alt"
              variant="filled"
            />
            <DashboardKpiCard
              title="Verificaciones Pendientes"
              value={data?.cards.pendingVerifications ?? null}
              icon="fluent:shield-task-28-filled"
              variant="outlined"
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr" },
              gap: 2,
            }}
          >
            <UserGrowthChart
              title="Crecimiento de usuarios"
              subtitle="Análisis de adquisición de usuarios en el último periodo"
              totalLabel="Usuarios totales"
              totalValue={
                typeof data?.userCounts.total === "number"
                  ? data.userCounts.total
                  : null
              }
              points={(data?.userGrowth ?? []).map((p) => ({
                label: p.label,
                count: p.count,
              }))}
            />

            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(15, 23, 42, 0.10)",
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              <Box sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack spacing={0.25}>
                    <Typography fontWeight={900}>
                      Profesionales pendientes de verificación
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Envíos recientes que requieren verificación de identidad
                    </Typography>
                  </Stack>
                  <Button
                    component={Link}
                    href="/dashboard/verificaciones"
                    variant="text"
                    sx={{ textTransform: "none", fontWeight: 900 }}
                  >
                    Ver todo
                  </Button>
                </Stack>
              </Box>

              <Divider />

              <Box sx={{ px: 2.5, py: 2 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.2fr 1.2fr 0.8fr",
                    gap: 2,
                    px: 1.5,
                    py: 1,
                    bgcolor: "#EEF6FA",
                    borderRadius: 2,
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#2B425A",
                  }}
                >
                  <span>Nombre del Doctor</span>
                  <span>Fecha de envío</span>
                  <span>Estado</span>
                  <Box sx={{ textAlign: "right" }}>Acción</Box>
                </Box>

                <Stack spacing={0} sx={{ mt: 1 }}>
                  {pendingDoctors.length ? (
                    pendingDoctors.slice(0, 5).map((d) => {
                      const s = statusChip(d.profileStatus);
                      return (
                        <Box
                          key={d.userId}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1.2fr 1.2fr 0.8fr",
                            gap: 2,
                            alignItems: "center",
                            px: 1.5,
                            py: 1.25,
                            borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={900} noWrap>
                              {d.displayName}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {d.displayEmail || d.email}
                            </Typography>
                          </Box>
                          <Typography fontWeight={800}>
                            {formatDate(d.submittedAt)}
                          </Typography>
                          <Box>
                            <Chip
                              label={s.label}
                              size="small"
                              sx={{
                                bgcolor: s.bg,
                                color: s.fg,
                                fontWeight: 900,
                                borderRadius: 2,
                              }}
                            />
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Button
                              component={Link}
                              href={`/dashboard/verificaciones/${encodeURIComponent(d.userId)}`}
                              variant="outlined"
                              size="small"
                              sx={{
                                textTransform: "none",
                                fontWeight: 900,
                                borderRadius: 2,
                              }}
                            >
                              Revisar
                            </Button>
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Box sx={{ px: 1.5, py: 2 }}>
                      <Typography color="text.secondary">
                        {loading ? "Cargando…" : "Sin pendientes."}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>

              <Box sx={{ px: 2.5, pb: 2 }}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    onClick={() => void fetchStats()}
                    variant="text"
                    startIcon={<Icon icon="mdi:refresh" />}
                    sx={{ textTransform: "none", fontWeight: 900 }}
                  >
                    Actualizar
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Box>
        </Stack>
      </DashboardLayout>
    </AdminGuard>
  );
}
