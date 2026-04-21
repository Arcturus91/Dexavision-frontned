/* eslint-disable @typescript-eslint/no-explicit-any */
import { Icon } from "@iconify/react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminGuard } from "@/components/AdminGuard";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/layouts/DashboardLayout";

type JobSummary = {
  jobId: string;
  userId: string;
  status: string;
  imageCount: number;
  createdAt: string;
  updatedAt: string;
  hasAnalysis: boolean;
  overallHealthScore: number | null;
  consultationReason: string | null;
};

function safeJsonError(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Ocurrió un error.";
}

function jobStatusLabel(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "Completado";
    case "ANALYZING":
      return "En análisis";
    case "PENDING":
      return "Pendiente";
    case "VALIDATING":
      return "Validando";
    case "FAILED":
      return "Error";
    default:
      return status;
  }
}

function jobStatusChipSx(status: string) {
  switch (status) {
    case "COMPLETED":
      return { bgcolor: "#e7f5ec", color: "#34a853" };
    case "FAILED":
      return { bgcolor: "#FFE6E6", color: "#D32F2F" };
    default:
      return { bgcolor: "#fdf5e6", color: "#fbbc05" };
  }
}

function scoreCircleSx(score: number | null, status: string) {
  if (status === "FAILED") return { bgcolor: "#FFE6E6", color: "#D32F2F" };
  if (score === null) return { bgcolor: "rgba(0,0,0,0.06)", color: "text.secondary" };
  if (score >= 0.8) return { bgcolor: "#e7f5ec", color: "#34a853" };
  if (score >= 0.6) return { bgcolor: "#fdf5e6", color: "#fbbc05" };
  return { bgcolor: "#FFE6E6", color: "#D32F2F" };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function getTimeGroupLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 2) return "Recientemente";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 14) return "Hace 1 semana";
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 60) return "Hace 1 mes";
  return `Hace ${Math.floor(diffDays / 30)} meses`;
}

export default function AnalisisListPage() {
  const router = useRouter();
  const userId =
    typeof router.query.userId === "string" ? router.query.userId : "";
  const { getIdToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobSummary[]>([]);

  const fetchJobs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("No hay token de Firebase disponible.");

      const resp = await fetch(
        `/api/admin/jobs?userId=${encodeURIComponent(userId)}&status=all&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const body = (await resp.json().catch(() => null)) as any;
      if (!resp.ok)
        throw new Error(
          body?.error?.message || "No se pudieron cargar los análisis.",
        );

      const list = body?.data?.jobs;
      setJobs(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(safeJsonError(err));
    } finally {
      setLoading(false);
    }
  }, [getIdToken, userId]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const { groups, order } = useMemo(() => {
    const g: Record<string, JobSummary[]> = {};
    const o: string[] = [];
    for (const job of jobs) {
      const label = getTimeGroupLabel(job.createdAt);
      if (!g[label]) {
        g[label] = [];
        o.push(label);
      }
      g[label].push(job);
    }
    return { groups: g, order: o };
  }, [jobs]);

  return (
    <AdminGuard>
      <Head>
        <title>DexaVision | Historial de Análisis</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardLayout>
        <Stack spacing={2}>
          <Box sx={{ color: "text.secondary", fontSize: 12 }}>
            <span>Usuarios</span> <span>›</span>{" "}
            <Link
              href={`/dashboard/usuarios/${encodeURIComponent(userId)}`}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Vista de usuario
            </Link>{" "}
            <span>›</span> <span>Análisis</span>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Button
              component={Link}
              href={`/dashboard/usuarios/${encodeURIComponent(userId)}`}
              variant="text"
              startIcon={<Icon icon="mdi:arrow-left" />}
              sx={{ textTransform: "none", fontWeight: 800, px: 0, alignSelf: "flex-start" }}
            >
              Historial de Análisis
            </Button>
          </Stack>

          <Typography color="text.secondary" sx={{ mt: -1 }}>
            Análisis realizados por el paciente
          </Typography>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {loading ? (
            <Typography color="text.secondary">Cargando…</Typography>
          ) : null}

          {!loading && !error && jobs.length === 0 ? (
            <Typography color="text.secondary">
              No hay análisis registrados.
            </Typography>
          ) : null}

          {order.map((groupLabel) => (
            <Stack key={groupLabel} spacing={1.5}>
              <Typography fontWeight={700} fontSize={16}>
                {groupLabel}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                {groups[groupLabel].map((job) => (
                  <Paper
                    key={job.jobId}
                    variant="outlined"
                    component={Link}
                    href={`/dashboard/usuarios/${encodeURIComponent(userId)}/analisis/${encodeURIComponent(job.jobId)}`}
                    sx={{
                      borderRadius: 2,
                      borderColor: "rgba(15, 23, 42, 0.10)",
                      p: 1.5,
                      textDecoration: "none",
                      display: "block",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "rgba(27,94,167,0.02)",
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontWeight: 700,
                          fontSize: 16,
                          ...scoreCircleSx(job.overallHealthScore, job.status),
                        }}
                      >
                        {job.overallHealthScore !== null
                          ? Math.round(job.overallHealthScore * 100)
                          : "—"}
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          spacing={1}
                        >
                          <Typography
                            fontWeight={700}
                            fontSize={15}
                            sx={{ color: "#07394f" }}
                            noWrap
                          >
                            {formatDate(job.createdAt)}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                            flexShrink={0}
                          >
                            <Chip
                              label={jobStatusLabel(job.status)}
                              size="small"
                              sx={{
                                ...jobStatusChipSx(job.status),
                                fontWeight: 700,
                                borderRadius: 1.5,
                                fontSize: 11,
                                height: 22,
                              }}
                            />
                            <Icon
                              icon="weui:arrow-outlined"
                              style={{ color: "#bac3c8", fontSize: 14 }}
                            />
                          </Stack>
                        </Stack>
                        <Typography
                          fontSize={13}
                          color="text.secondary"
                          noWrap
                          sx={{ mt: 0.25 }}
                        >
                          {job.consultationReason || "Sin motivo registrado"}
                        </Typography>
                        <Typography
                          fontSize={12}
                          sx={{ color: "#bac3c8", mt: 0.25 }}
                        >
                          #{job.jobId.slice(0, 8).toUpperCase()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Box>
            </Stack>
          ))}
        </Stack>
      </DashboardLayout>
    </AdminGuard>
  );
}
