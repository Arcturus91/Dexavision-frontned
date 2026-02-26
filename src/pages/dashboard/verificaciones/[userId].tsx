import { Icon } from "@iconify/react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Radio,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { AdminGuard } from "@/components/AdminGuard";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import type {
  DoctorDetail,
  DoctorDetailResponse,
  DocumentUrl,
} from "@/types/doctors";

type Decision = "approve" | "reject";
type DocType =
  | "certificado_profesional"
  | "certificado_superintendencia_salud"
  | "registro_sanitario";

const DOC_TYPE_ORDER: DocType[] = [
  "certificado_profesional",
  "certificado_superintendencia_salud",
  "registro_sanitario",
];

const DOC_TYPE_LABEL: Record<DocType, string> = {
  certificado_profesional: "Certificado Profesional",
  certificado_superintendencia_salud: "Superintendencia de Salud",
  registro_sanitario: "Registro Sanitario",
};

const DOC_TYPE_ICON: Record<DocType, string> = {
  certificado_profesional: "mdi:check-decagram-outline",
  certificado_superintendencia_salud: "mdi:shield-check-outline",
  registro_sanitario: "mdi:file-document-outline",
};

function formatTimeRange(start: string, end: string) {
  if (!start || !end) return "—";
  return `${start} - ${end}`;
}

function weekdayLabel(key: string) {
  const map: Record<string, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  };
  return map[key] ?? key;
}

function safeJsonError(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Ocurrió un error.";
}

export default function VerificacionDetallePage() {
  const router = useRouter();
  const userId =
    typeof router.query.userId === "string" ? router.query.userId : "";
  const { getIdToken } = useAuth();

  const [tab, setTab] = useState<"perfil" | "documentos">("perfil");
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [decision, setDecision] = useState<Decision>("approve");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  const documentUrls = useMemo<DocumentUrl[]>(
    () => doctor?.documentUrls ?? [],
    [doctor],
  );
  const docsByType = useMemo(() => {
    const map = new Map<string, DocumentUrl>();
    for (const d of documentUrls) {
      if (d?.type && !map.has(d.type)) map.set(d.type, d);
    }
    return map;
  }, [documentUrls]);

  const firstAvailableDocType = useMemo<DocType | null>(() => {
    for (const t of DOC_TYPE_ORDER) {
      if (docsByType.has(t)) return t;
    }
    return null;
  }, [docsByType]);

  const [selectedDocType, setSelectedDocType] = useState<DocType>(
    "certificado_profesional",
  );

  useEffect(() => {
    if (!doctor) return;
    const next = firstAvailableDocType ?? "certificado_profesional";
    setSelectedDocType(next);
  }, [doctor, firstAvailableDocType]);

  const fetchDoctor = useCallback(async () => {
    if (!userId) return;
    setError(null);
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("No hay token de Firebase disponible.");

      const resp = await fetch(
        `/api/admin/doctors/${encodeURIComponent(userId)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const body = (await resp.json().catch(() => null)) as unknown;
      if (!resp.ok) throw new Error("No se pudo cargar el doctor.");

      const parsed = body as DoctorDetailResponse;
      if (!parsed?.data) throw new Error("Respuesta inesperada del servidor.");

      setDoctor(parsed.data);
    } catch (err) {
      setDoctor(null);
      setError(safeJsonError(err));
    } finally {
      setLoading(false);
    }
  }, [getIdToken, userId]);

  useEffect(() => {
    void fetchDoctor();
  }, [fetchDoctor]);

  async function submitReview() {
    if (!userId) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitOk(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("No hay token de Firebase disponible.");

      const resp = await fetch(
        `/api/admin/doctors/${encodeURIComponent(userId)}/review`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            action: decision,
            message: message.trim(),
          }),
        },
      );

      const body = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(
          typeof body === "string" ? body : "No se pudo enviar la decisión.",
        );
      }

      setSubmitOk("Decisión enviada correctamente.");
      await fetchDoctor();
    } catch (err) {
      setSubmitError(safeJsonError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminGuard>
      <Head>
        <title>DexaVision | Detalles de la verificación</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardLayout>
        <Stack spacing={2}>
          <Box sx={{ color: "text.secondary", fontSize: 12 }}>
            <span>Verificación</span> <span>›</span>{" "}
            <span>Detalles de la verificación</span>
          </Box>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Button
              component={Link}
              href="/dashboard/verificaciones"
              variant="text"
              startIcon={<Icon icon="mdi:arrow-left" />}
              sx={{ textTransform: "none", fontWeight: 800, px: 0 }}
            >
              Detalles de la verificación
            </Button>
          </Stack>

          <Typography color="text.secondary" sx={{ mt: -1 }}>
            Revisa, valida o solicita correcciones a los documentos enviados.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 360px" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(15, 23, 42, 0.10)",
                overflow: "hidden",
              }}
            >
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                  px: 2,
                  pt: 1,
                  "& .MuiTabs-indicator": { display: "none" },
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 900,
                    minHeight: 40,
                    borderRadius: 2,
                    mr: 1,
                    "&.Mui-selected": {
                      bgcolor: "rgba(27, 94, 167, 0.10)",
                      color: "primary.main",
                    },
                  },
                }}
              >
                <Tab value="perfil" label="Perfil" />
                <Tab value="documentos" label="Documentos" />
              </Tabs>
              <Divider />

              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {error ? <Alert severity="error">{error}</Alert> : null}
                {loading ? (
                  <Typography color="text.secondary">Cargando…</Typography>
                ) : null}

                {doctor && tab === "perfil" ? (
                  <Stack spacing={2.5}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        src={doctor.photoURL ?? undefined}
                        sx={{ width: 64, height: 64 }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={900} noWrap>
                          {doctor.professionalName || doctor.displayName || "—"}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {(doctor.tags ?? []).slice(0, 6).map((t) => (
                            <Chip
                              key={t}
                              label={t}
                              size="small"
                              sx={{
                                bgcolor: "rgba(27, 94, 167, 0.08)",
                                color: "primary.main",
                                fontWeight: 800,
                                borderRadius: 2,
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    </Stack>

                    <Divider />

                    <Typography fontWeight={900}>
                      <Box
                        component="span"
                        sx={{ color: "primary.main", mr: 1 }}
                      >
                        |
                      </Box>
                      Información Principal
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <Stack spacing={1.25}>
                        <Paper
                          variant="outlined"
                          sx={{
                            borderRadius: 2.5,
                            p: 1.5,
                            bgcolor: "#F3F8FB",
                            borderColor: "rgba(15, 23, 42, 0.06)",
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.25}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 2,
                                bgcolor: "#fff",
                                display: "grid",
                                placeItems: "center",
                                border: "1px solid rgba(15, 23, 42, 0.08)",
                              }}
                            >
                              <Icon icon="mdi:map-marker" />
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={900}>
                                Ubicación
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {doctor.address || "—"}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>

                        <Paper
                          variant="outlined"
                          sx={{
                            borderRadius: 2.5,
                            p: 1.5,
                            bgcolor: "#F3F8FB",
                            borderColor: "rgba(15, 23, 42, 0.06)",
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.25}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 2,
                                bgcolor: "#fff",
                                display: "grid",
                                placeItems: "center",
                                border: "1px solid rgba(15, 23, 42, 0.08)",
                              }}
                            >
                              <Icon icon="mdi:email-outline" />
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={900}>
                                Correo electrónico
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {doctor.displayEmail || doctor.email || "—"}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>

                        <Paper
                          variant="outlined"
                          sx={{
                            borderRadius: 2.5,
                            p: 1.5,
                            bgcolor: "#F3F8FB",
                            borderColor: "rgba(15, 23, 42, 0.06)",
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.25}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 2,
                                bgcolor: "#fff",
                                display: "grid",
                                placeItems: "center",
                                border: "1px solid rgba(15, 23, 42, 0.08)",
                              }}
                            >
                              <Icon icon="mdi:phone-outline" />
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={900}>
                                Teléfono
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {doctor.phone || "—"}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Stack>

                      <Paper
                        variant="outlined"
                        sx={{
                          borderRadius: 2.5,
                          p: 2,
                          bgcolor: "#fff",
                          borderColor: "rgba(15, 23, 42, 0.08)",
                        }}
                      >
                        <Stack spacing={1.5}>
                          <Stack
                            direction="row"
                            spacing={1.25}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 2,
                                bgcolor: "#EEF6FA",
                                display: "grid",
                                placeItems: "center",
                                border: "1px solid rgba(15, 23, 42, 0.08)",
                              }}
                            >
                              <Icon icon="mdi:clock-outline" />
                            </Box>
                            <Typography variant="body2" fontWeight={900}>
                              Horarios de atención
                            </Typography>
                          </Stack>

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "1fr auto",
                              rowGap: 1,
                              columnGap: 2,
                            }}
                          >
                            {Object.entries(doctor.availability ?? {})
                              .length ? (
                              Object.entries(doctor.availability ?? {}).map(
                                ([day, v]) => (
                                  <React.Fragment key={day}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {weekdayLabel(day)}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      fontWeight={800}
                                      color={
                                        v?.available
                                          ? "text.primary"
                                          : "text.disabled"
                                      }
                                    >
                                      {v?.available
                                        ? formatTimeRange(v.start, v.end)
                                        : "Cerrado"}
                                    </Typography>
                                  </React.Fragment>
                                ),
                              )
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                —
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </Paper>
                    </Box>
                  </Stack>
                ) : null}

                {doctor && tab === "documentos"
                  ? (() => {
                      const selectedDoc =
                        docsByType.get(selectedDocType) ?? null;
                      return (
                        <Stack spacing={1.75}>
                          <Tabs
                            value={selectedDocType}
                            onChange={(_, v) => setSelectedDocType(v)}
                            variant="scrollable"
                            scrollButtons={false}
                            sx={{
                              px: 0,
                              "& .MuiTabs-indicator": {
                                bgcolor: "primary.main",
                                height: 3,
                                borderRadius: 999,
                              },
                              "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 800,
                                minHeight: 40,
                                px: 1.5,
                                mr: 1.25,
                                color: "text.secondary",
                                "&.Mui-selected": {
                                  color: "primary.main",
                                },
                              },
                            }}
                          >
                            {DOC_TYPE_ORDER.map((t) => (
                              <Tab
                                key={t}
                                value={t}
                                disabled={!docsByType.has(t)}
                                icon={
                                  <Icon
                                    icon={DOC_TYPE_ICON[t]}
                                    width={18}
                                    height={18}
                                  />
                                }
                                iconPosition="start"
                                label={DOC_TYPE_LABEL[t]}
                              />
                            ))}
                          </Tabs>

                          {selectedDoc ? (
                            <Paper
                              variant="outlined"
                              sx={{
                                borderRadius: 2.5,
                                overflow: "hidden",
                                borderColor: "rgba(15, 23, 42, 0.10)",
                              }}
                            >
                              <Box
                                sx={{
                                  height: { xs: 420, md: 520 },
                                  bgcolor: "#fff",
                                }}
                              >
                                <Box
                                  component="iframe"
                                  title={selectedDoc.key}
                                  src={selectedDoc.url}
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    border: 0,
                                  }}
                                />
                              </Box>

                              <Divider />

                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "stretch", sm: "center" }}
                                justifyContent="space-between"
                                sx={{ p: 1.5 }}
                              >
                                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                                  <Typography fontWeight={900} noWrap>
                                    {DOC_TYPE_LABEL[selectedDocType]}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    noWrap
                                  >
                                    {selectedDoc.url}
                                  </Typography>
                                </Stack>
                                <Button
                                  component="a"
                                  href={selectedDoc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  variant="outlined"
                                  startIcon={<Icon icon="mdi:open-in-new" />}
                                  sx={{
                                    textTransform: "none",
                                    fontWeight: 800,
                                    borderRadius: 2,
                                  }}
                                >
                                  Abrir
                                </Button>
                              </Stack>
                            </Paper>
                          ) : (
                            <Typography color="text.secondary">
                              No hay documento disponible para esta sección.
                            </Typography>
                          )}
                        </Stack>
                      );
                    })()
                  : null}
              </Box>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(15, 23, 42, 0.10)",
                p: 2.5,
                position: { lg: "sticky" },
                top: { lg: 96 },
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Icon icon="mdi:gavel" />
                  <Typography fontWeight={900}>Decision final</Typography>
                </Stack>

                {submitOk ? <Alert severity="success">{submitOk}</Alert> : null}
                {submitError ? (
                  <Alert severity="error">{submitError}</Alert>
                ) : null}

                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Radio
                      checked={decision === "approve"}
                      onChange={() => setDecision("approve")}
                    />
                    <Typography fontWeight={800}>Aprobar perfil</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Radio
                      checked={decision === "reject"}
                      onChange={() => setDecision("reject")}
                    />
                    <Typography fontWeight={800}>Rechazar perfil</Typography>
                  </Stack>
                </Stack>

                <TextField
                  label="Mensaje"
                  placeholder="Escribe una nota para el doctor..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                />

                <Button
                  variant="contained"
                  disabled={submitting || !userId}
                  onClick={() => void submitReview()}
                  sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    py: 1.1,
                    background:
                      "linear-gradient(180deg, #2B7CCB 0%, #1B5EA7 100%)",
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "none",
                      background:
                        "linear-gradient(180deg, #2B7CCB 0%, #184F8C 100%)",
                    },
                  }}
                >
                  Enviar decisión
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </DashboardLayout>
    </AdminGuard>
  );
}
