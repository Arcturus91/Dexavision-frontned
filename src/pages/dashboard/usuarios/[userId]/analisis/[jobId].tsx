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
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

import { AdminGuard } from "@/components/AdminGuard";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/layouts/DashboardLayout";

type Finding = {
  condition: string;
  finding: string;
  confidence: number;
  severity: string;
  tooth: string;
  surface: string;
  icdas: number;
  treatmentCategory: string;
  urgency: string;
};

type JobAnalysis = {
  dentitionType: string;
  findings: Finding[];
  overallHealthScore: number;
  requiresProfessionalReview: boolean;
};

type JobDetail = {
  jobId: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  consultationReason: string | null;
  imageKeys: string[];
  imageUrls: string[];
  analysis: JobAnalysis | null;
};

function safeJsonError(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Ocurrió un error.";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function healthScoreInfo(score: number): { label: string; sublabel: string } {
  if (score >= 0.8)
    return {
      label: "Excelente salud bucal",
      sublabel: "Sigue así con tus hábitos de higiene.",
    };
  if (score >= 0.6)
    return {
      label: "Salud bocal moderada",
      sublabel: "Se recomienda visitar a un profesional.",
    };
  if (score >= 0.4)
    return {
      label: "Salud bucal deficiente",
      sublabel: "Se requiere atención dental próximamente.",
    };
  return {
    label: "Salud bucal crítica",
    sublabel: "Se requiere atención dental urgente.",
  };
}

function analysisStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return {
        label: "Análisis completado",
        icon: "mdi:check-circle",
        sx: { bgcolor: "#e7f7f2", color: "#34a853" },
      };
    case "FAILED":
      return {
        label: "Error en el análisis",
        icon: "mdi:close-circle",
        sx: { bgcolor: "#FFE6E6", color: "#D32F2F" },
      };
    default:
      return {
        label: "Análisis en curso",
        icon: "mdi:clock-outline",
        sx: { bgcolor: "#fdf5e6", color: "#fbbc05" },
      };
  }
}

function findingSeverityLabel(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "high":
      return "Alta";
    case "medium":
      return "Media";
    case "low":
      return "Baja";
    default:
      return severity || "—";
  }
}

function findingSeverityChipSx(severity: string) {
  switch (severity?.toLowerCase()) {
    case "high":
      return { bgcolor: "#FFE6E6", color: "#D32F2F" };
    case "medium":
      return { bgcolor: "#fdf5e6", color: "#fbbc05" };
    case "low":
    default:
      return { bgcolor: "rgba(52,168,83,0.25)", color: "#34a853" };
  }
}

function generateRecommendations(
  findings: Finding[],
  requiresProfessionalReview: boolean,
): string[] {
  const recs: string[] = [];
  if (requiresProfessionalReview) {
    recs.push("Agenda una cita con un dentista.");
  }
  if (
    findings.some(
      (f) => f.urgency === "within_week" || f.urgency === "immediate",
    )
  ) {
    recs.push("Algunos hallazgos requieren atención dental esta semana.");
  }
  if (findings.some((f) => f.treatmentCategory === "restorative")) {
    recs.push(
      "Se detectaron caries que pueden requerir tratamiento restaurador.",
    );
  }
  recs.push(
    "Mejora tu cepillado, realiza movimientos circulares cuando te cepilles.",
  );
  recs.push("Considera usar enjuague bucal.");
  if (requiresProfessionalReview) {
    recs.push("Te recomendamos una limpieza profesional.");
  }
  return recs;
}

function HealthGauge({ score }: { score: number }) {
  // Accept score as 0..1 or 0..100
  const pctRaw = score <= 1.01 ? score * 100 : score;
  const pct = Math.max(0, Math.min(100, pctRaw));

  const W = 240;
  const H = 140;
  const r = 95;
  const sw = 18;

  const cx = W / 2;
  const cy = H - sw / 2; // keep stroke fully inside viewBox
  const sx = cx - r;
  const ex = cx + r;
  const arcPath = `M ${sx} ${cy} A ${r} ${r} 0 0 1 ${ex} ${cy}`;

  return (
    <Box sx={{ position: "relative", width: W, height: H, flexShrink: 0 }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
      >
        {/* Track */}
        <path
          d={arcPath}
          pathLength={100}
          fill="none"
          stroke="rgba(15, 23, 42, 0.14)"
          strokeWidth={sw}
          strokeLinecap="butt"
        />

        {/* Progress */}
        <path
          d={arcPath}
          pathLength={100}
          fill="none"
          stroke="#0688d3"
          strokeWidth={sw}
          strokeLinecap="butt"
          strokeDasharray={`${pct} 100`}
          style={{ transition: "stroke-dasharray 500ms ease" }}
        />
      </svg>

      {/* % label anchored to the bottom */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <Typography sx={{ fontSize: 50, fontWeight: 900, lineHeight: 1 }}>
          {Math.round(pct)}%
        </Typography>
      </Box>
    </Box>
  );
}

export default function AnalisisDetallePage() {
  const router = useRouter();
  const userId =
    typeof router.query.userId === "string" ? router.query.userId : "";
  const jobId =
    typeof router.query.jobId === "string" ? router.query.jobId : "";
  const { getIdToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("No hay token de Firebase disponible.");

      const resp = await fetch(`/api/admin/jobs/${encodeURIComponent(jobId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = (await resp.json().catch(() => null)) as any;
      if (!resp.ok)
        throw new Error(
          body?.error?.message || "No se pudo cargar el análisis.",
        );

      setJob(body?.data ?? null);
      setSelectedImage(0);
    } catch (err) {
      setError(safeJsonError(err));
    } finally {
      setLoading(false);
    }
  }, [getIdToken, jobId]);

  useEffect(() => {
    void fetchJob();
  }, [fetchJob]);

  const badge = analysisStatusBadge(job?.status ?? "");
  const scoreInfo = job?.analysis
    ? healthScoreInfo(job.analysis.overallHealthScore)
    : null;
  const recommendations =
    job?.analysis && job.status === "COMPLETED"
      ? generateRecommendations(
          job.analysis.findings,
          job.analysis.requiresProfessionalReview,
        )
      : [];
  const images = job?.imageUrls ?? [];
  const shortId = jobId.slice(0, 8).toUpperCase();

  return (
    <AdminGuard>
      <Head>
        <title>DexaVision | Detalle de Análisis</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardLayout>
        <Stack spacing={2}>
          {/* Breadcrumb */}
          <Box sx={{ color: "text.secondary", fontSize: 12 }}>
            <span>Usuarios</span> <span>›</span>{" "}
            <Link
              href={`/dashboard/usuarios/${encodeURIComponent(userId)}`}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Vista de usuario
            </Link>{" "}
            <span>›</span>{" "}
            <Link
              href={`/dashboard/usuarios/${encodeURIComponent(userId)}/analisis`}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Análisis
            </Link>{" "}
            <span>›</span> <span>#{shortId}</span>
          </Box>

          {/* Header */}
          <Stack spacing={0.25}>
            <Button
              component={Link}
              href={`/dashboard/usuarios/${encodeURIComponent(userId)}/analisis`}
              variant="text"
              startIcon={<Icon icon="mdi:arrow-left" />}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                px: 0,
                alignSelf: "flex-start",
              }}
            >
              Análisis #{shortId}
            </Button>
            <Typography color="text.secondary" fontSize={14}>
              Detalles de Análisis
            </Typography>
            {job ? (
              <Typography color="text.secondary" fontSize={12}>
                {formatDate(job.createdAt)}
              </Typography>
            ) : null}
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {loading ? (
            <Typography color="text.secondary">Cargando…</Typography>
          ) : null}

          {job ? (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(15,23,42,0.10)",
                overflow: "hidden",
                display: "flex",
                flexDirection: { xs: "column", lg: "row" },
                alignItems: "stretch",
              }}
            >
              {/* ── LEFT COLUMN: score + findings ── */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  p: { xs: 2, sm: 3 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                {/* Score section: badge + gauge (left) / health label (right) */}
                <Box
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: 3,
                    py: 2,
                    display: "flex",
                    gap: 2.5,
                    alignItems: "center",
                  }}
                >
                  {/* Left: badge + gauge */}
                  <Stack
                    // spacing={2.25}
                    alignItems="center"
                    sx={{ flexShrink: 0 }}
                  >
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        ...badge.sx,
                      }}
                    >
                      <Icon icon={badge.icon} style={{ fontSize: 18 }} />
                      <Typography fontWeight={700} fontSize={14}>
                        {badge.label}
                      </Typography>
                    </Box>

                    {job.analysis ? (
                      <HealthGauge score={job.analysis.overallHealthScore} />
                    ) : (
                      <Typography color="text.secondary" fontSize={13}>
                        Sin puntuación
                      </Typography>
                    )}
                  </Stack>

                  {/* Right: health label */}
                  {scoreInfo ? (
                    <Stack spacing={1} sx={{ flex: 1, minWidth: 0, mt: 1 }}>
                      <Typography
                        fontWeight={900}
                        fontSize={22}
                        lineHeight={1.2}
                      >
                        {scoreInfo.label}
                      </Typography>
                      <Typography color="text.secondary" fontSize={13}>
                        {scoreInfo.sublabel}
                      </Typography>
                    </Stack>
                  ) : null}
                </Box>

                {/* Findings */}
                {job.analysis && job.analysis.findings.length > 0 ? (
                  <Stack spacing={1.5}>
                    <Typography fontWeight={700} fontSize={15}>
                      Hallazgos detectados
                    </Typography>
                    <Stack spacing={2}>
                      {job.analysis.findings.map((f, i) => (
                        <Paper
                          key={i}
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            borderColor: "rgba(15,23,42,0.10)",
                            p: 1.5,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.25,
                          }}
                        >
                          {/* Condition row */}
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={1}
                          >
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                            >
                              <Icon
                                icon={
                                  f.severity?.toLowerCase() === "low"
                                    ? "prime:check-circle"
                                    : "mingcute:information-line"
                                }
                                style={{
                                  fontSize: 22,
                                  color:
                                    f.severity?.toLowerCase() === "low"
                                      ? "#34a853"
                                      : f.severity?.toLowerCase() === "high"
                                        ? "#D32F2F"
                                        : "#fbbc05",
                                }}
                              />
                              <Typography fontWeight={700} fontSize={15}>
                                {f.condition}
                              </Typography>
                            </Stack>
                            <Chip
                              label={findingSeverityLabel(f.severity)}
                              size="small"
                              sx={{
                                ...findingSeverityChipSx(f.severity),
                                fontWeight: 700,
                                borderRadius: 1.5,
                                fontSize: 13,
                                height: 26,
                                flexShrink: 0,
                              }}
                            />
                          </Stack>

                          {/* Description */}
                          <Typography
                            fontSize={14}
                            color="text.secondary"
                            sx={{ lineHeight: 1.55 }}
                          >
                            {f.finding}
                          </Typography>

                          {/* Confidence bar */}
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                flex: 1,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: "#c0deef",
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                sx={{
                                  height: "100%",
                                  borderRadius: 4,
                                  bgcolor: "#0688d3",
                                  width: `${Math.round(f.confidence * 100)}%`,
                                }}
                              />
                            </Box>
                            <Typography
                              fontSize={11}
                              color="text.secondary"
                              sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
                            >
                              {Math.round(f.confidence * 100)}% confianza
                            </Typography>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                ) : null}

                {/* Consultation reason */}
                {job.consultationReason ? (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "#F3F8FB",
                      border: "1px solid rgba(15,23,42,0.06)",
                    }}
                  >
                    <Typography
                      fontSize={12}
                      color="text.secondary"
                      fontWeight={700}
                      sx={{ mb: 0.5 }}
                    >
                      Motivo de consulta
                    </Typography>
                    <Typography fontSize={14}>
                      {job.consultationReason}
                    </Typography>
                  </Box>
                ) : null}

                {!job.analysis && job.status !== "COMPLETED" ? (
                  <Typography color="text.secondary" fontSize={13}>
                    El análisis aún no está disponible.
                  </Typography>
                ) : null}
              </Box>

              {/* ── VERTICAL DIVIDER ── */}
              <Divider
                orientation="vertical"
                flexItem
                sx={{ display: { xs: "none", lg: "block" } }}
              />
              <Divider sx={{ display: { xs: "block", lg: "none" } }} />

              {/* ── RIGHT COLUMN: images + recommendations ── */}
              <Box
                sx={{
                  width: { xs: "100%", lg: 354 },
                  flexShrink: 0,
                  p: { xs: 2, sm: 3 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 2.5,
                }}
              >
                {/* Images carousel */}
                {images.length > 0 ? (
                  <Stack spacing={1.5}>
                    <Typography fontWeight={700} fontSize={18}>
                      Imágenes ({selectedImage + 1}/{images.length})
                    </Typography>

                    {/* Main image */}
                    <Box
                      sx={{
                        width: "100%",
                        // height: 204,
                        borderRadius: 3,
                        overflow: "hidden",
                        bgcolor: "#d9d9d9",
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        component="img"
                        src={images[selectedImage]}
                        alt={`Imagen ${selectedImage + 1}`}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </Box>

                    {/* Thumbnails */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 1.5,
                        overflowX: "auto",
                        pb: 0.5,
                        "&::-webkit-scrollbar": { height: 4 },
                        "&::-webkit-scrollbar-thumb": {
                          bgcolor: "rgba(0,0,0,0.15)",
                          borderRadius: 2,
                        },
                      }}
                    >
                      {images.map((url, idx) => (
                        <Box
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          sx={{
                            width: 64,
                            height: 40,
                            borderRadius: 2,
                            overflow: "hidden",
                            flexShrink: 0,
                            cursor: "pointer",
                            border:
                              selectedImage === idx
                                ? "2px solid #0b5ed7"
                                : "2px solid transparent",
                            opacity: selectedImage === idx ? 1 : 0.7,
                            transition: "border-color 0.15s, opacity 0.15s",
                            "&:hover": { opacity: 1 },
                          }}
                        >
                          <Box
                            component="img"
                            src={url}
                            alt={`Miniatura ${idx + 1}`}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                              pointerEvents: "none",
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Stack>
                ) : (
                  <Typography color="text.secondary" fontSize={13}>
                    No hay imágenes disponibles.
                  </Typography>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 ? (
                  <Box
                    sx={{
                      bgcolor: "#edf4f7",
                      borderRadius: 2,
                      p: 2,
                    }}
                  >
                    <Typography fontWeight={700} fontSize={15} sx={{ mb: 1 }}>
                      Recomendaciones:
                    </Typography>
                    <Box
                      component="ul"
                      sx={{
                        m: 0,
                        pl: 2.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {recommendations.map((rec, i) => (
                        <Typography
                          key={i}
                          component="li"
                          fontSize={14}
                          color="text.secondary"
                          sx={{ lineHeight: 1.5 }}
                        >
                          {rec}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                ) : null}
              </Box>
            </Paper>
          ) : null}
        </Stack>
      </DashboardLayout>
    </AdminGuard>
  );
}
