/* eslint-disable @typescript-eslint/no-explicit-any */
import { Icon } from "@iconify/react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Snackbar,
  Stack,
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
import type { DoctorDetail } from "@/types/doctors";
import type { BasicUserDetail, PatientDetail } from "@/types/users";

function safeJsonError(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Ocurrió un error.";
}

function errorMessageFromBody(body: any): string {
  const msg = body?.error?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (typeof body?.error === "string" && body.error.trim()) return body.error;
  return "Ocurrió un error.";
}

function accountStatusLabel(value: string | null | undefined): string {
  const v = String(value ?? "").toLowerCase();
  switch (v) {
    case "blocked":
      return "Bloqueado";
    case "suspended":
      return "Suspendido";
    case "active":
    default:
      return "Activo";
  }
}

function accountStatusChipSx(value: string | null | undefined) {
  const v = String(value ?? "").toLowerCase();
  switch (v) {
    case "blocked":
      return { bgcolor: "#FFE6E6", color: "#D32F2F" };
    case "suspended":
      return { bgcolor: "#FFF1D6", color: "#F5A623" };
    case "active":
    default:
      return { bgcolor: "#E6F7EA", color: "#2E7D32" };
  }
}

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

function isDoctorDetail(data: unknown): data is DoctorDetail {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.userId === "string" &&
    typeof d.role === "string" &&
    typeof d.displayName === "string" &&
    typeof d.email === "string" &&
    typeof d.profileStatus === "string"
  );
}

function toBasicUserDetail(data: unknown): BasicUserDetail | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (
    typeof d.userId !== "string" ||
    typeof d.email !== "string" ||
    typeof d.displayName !== "string" ||
    typeof d.role !== "string" ||
    typeof d.createdAt !== "string" ||
    typeof d.updatedAt !== "string"
  ) {
    return null;
  }
  return {
    userId: d.userId,
    email: d.email,
    displayName: d.displayName,
    role: d.role,
    accountStatus:
      d.accountStatus === null || typeof d.accountStatus === "string"
        ? (d.accountStatus ?? undefined)
        : undefined,
    statusChangeReason:
      d.statusChangeReason === null || typeof d.statusChangeReason === "string"
        ? (d.statusChangeReason ?? undefined)
        : undefined,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    profilePictureUrl:
      d.profilePictureUrl === null || typeof d.profilePictureUrl === "string"
        ? d.profilePictureUrl
        : undefined,
  };
}

function doctorStatusChips(
  profileStatus: string,
): Array<{ label: string; tone: "ok" | "info" | "warn" | "danger" }> {
  switch (profileStatus) {
    case "approved":
      return [{ label: "Doctor verificado", tone: "ok" }];
    case "in_review":
      return [{ label: "Doctor (en revisión)", tone: "info" }];
    case "incomplete":
      return [{ label: "Corrección necesaria", tone: "warn" }];
    case "rejected":
      return [{ label: "Rechazado", tone: "danger" }];
    default:
      return [{ label: profileStatus, tone: "info" }];
  }
}

function chipSx(tone: "ok" | "info" | "warn" | "danger") {
  switch (tone) {
    case "ok":
      return { bgcolor: "#E6F7EA", color: "#2E7D32" };
    case "warn":
      return { bgcolor: "#FFF1D6", color: "#F5A623" };
    case "danger":
      return { bgcolor: "#FFE6E6", color: "#D32F2F" };
    case "info":
    default:
      return { bgcolor: "rgba(27, 94, 167, 0.10)", color: "#1B5EA7" };
  }
}

function toPatientDetail(data: unknown): PatientDetail | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.role !== "patient") return null;
  if (
    typeof d.userId !== "string" ||
    typeof d.email !== "string" ||
    typeof d.displayName !== "string" ||
    typeof d.createdAt !== "string" ||
    typeof d.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    userId: d.userId,
    email: d.email,
    displayName: d.displayName,
    role: "patient",
    accountStatus:
      d.accountStatus === null || typeof d.accountStatus === "string"
        ? (d.accountStatus ?? undefined)
        : undefined,
    statusChangeReason:
      d.statusChangeReason === null || typeof d.statusChangeReason === "string"
        ? (d.statusChangeReason ?? undefined)
        : undefined,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    profilePictureUrl:
      d.profilePictureUrl === null || typeof d.profilePictureUrl === "string"
        ? d.profilePictureUrl
        : undefined,
    address: typeof d.address === "string" ? d.address : "",
    age: typeof d.age === "number" ? d.age : 0,
    alcohol: typeof d.alcohol === "string" ? d.alcohol : "",
    allergies: typeof d.allergies === "string" ? d.allergies : "",
    brushCount: typeof d.brushCount === "number" ? d.brushCount : 0,
    diseases: typeof d.diseases === "string" ? d.diseases : "",
    gender: typeof d.gender === "string" ? d.gender : "",
    phone: typeof d.phone === "string" ? d.phone : "",
    pregnant: typeof d.pregnant === "boolean" ? d.pregnant : undefined,
    smoke: typeof d.smoke === "string" ? d.smoke : "",
    lastDental: typeof d.lastDental === "string" ? d.lastDental : undefined,
  };
}

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

function genderLabel(value: string): string {
  switch (value) {
    case "male":
      return "Masculino";
    case "female":
      return "Femenino";
    case "other":
      return "Otro";
    default:
      return value || "—";
  }
}

function frequencyLabel(value: string): string {
  switch (value) {
    case "never":
      return "No";
    case "occasionally":
      return "Ocasional";
    case "frequently":
      return "Frecuente";
    case "daily":
      return "Diario";
    default:
      return value || "—";
  }
}

export default function UsuarioDetallePage() {
  const router = useRouter();
  const userId =
    typeof router.query.userId === "string" ? router.query.userId : "";
  const { getIdToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [user, setUser] = useState<BasicUserDetail | null>(null);
  const [patient, setPatient] = useState<PatientDetail | null>(null);

  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonAction, setReasonAction] = useState<"suspend" | "block" | null>(
    null,
  );
  const [reasonText, setReasonText] = useState("");
  const [reasonSaving, setReasonSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("No hay token de Firebase disponible.");

      const resp = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const body = (await resp.json().catch(() => null)) as any;
      if (!resp.ok) throw new Error("No se pudo cargar el usuario.");
      const data = body?.data;

      console.log(data);

      if (isDoctorDetail(data) && data.role === "doctor") {
        setDoctor(data as DoctorDetail);
        setUser(null);
        setPatient(null);
        return;
      }

      const p = toPatientDetail(data);
      if (p) {
        setPatient(p);
        setDoctor(null);
        setUser(null);
        return;
      }

      const basic = toBasicUserDetail(data);
      if (!basic) throw new Error("Respuesta inesperada del servidor.");
      setUser(basic);
      setDoctor(null);
      setPatient(null);
    } catch (err) {
      setDoctor(null);
      setUser(null);
      setPatient(null);
      setError(safeJsonError(err));
    } finally {
      setLoading(false);
    }
  }, [getIdToken, userId]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const headerTitle = "Vista de usuario";

  const accountStatus = useMemo(() => {
    const fromDoctor = (doctor as any)?.accountStatus;
    const fromUser = user?.accountStatus;
    const fromPatient = (patient as any)?.accountStatus;
    return (fromDoctor ?? fromPatient ?? fromUser ?? "active") as string;
  }, [doctor, patient, user]);

  const statusChangeReason = useMemo(() => {
    const fromDoctor = (doctor as any)?.statusChangeReason;
    const fromPatient = (patient as any)?.statusChangeReason;
    const fromUser = user?.statusChangeReason;
    const reason = fromDoctor ?? fromPatient ?? fromUser ?? null;
    return typeof reason === "string" ? reason : null;
  }, [doctor, patient, user]);

  const showAccountStatus = useMemo(() => {
    const s = String(accountStatus).toLowerCase();
    return s === "blocked" || s === "suspended";
  }, [accountStatus]);

  async function runToggle(action: "suspend" | "block", reason: string) {
    const token = await getIdToken();
    if (!token) throw new Error("No hay token de Firebase disponible.");

    const path =
      action === "suspend"
        ? `/api/admin/users/${encodeURIComponent(userId)}/suspend`
        : `/api/admin/users/${encodeURIComponent(userId)}/block`;

    const resp = await fetch(path, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ reason }),
    });
    const body = (await resp.json().catch(() => null)) as any;
    if (!resp.ok || body?.success === false) {
      throw new Error(errorMessageFromBody(body));
    }
  }

  async function runDelete() {
    const token = await getIdToken();
    if (!token) throw new Error("No hay token de Firebase disponible.");
    const resp = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await resp.json().catch(() => null)) as any;
    if (!resp.ok || body?.success === false) {
      throw new Error(errorMessageFromBody(body));
    }
  }

  return (
    <AdminGuard>
      <Head>
        <title>DexaVision | Vista de usuario</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardLayout>
        <Stack spacing={2}>
          <Box sx={{ color: "text.secondary", fontSize: 12 }}>
            <span>Usuarios</span> <span>›</span> <span>Vista de usuario</span>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Button
                component={Link}
                href="/dashboard/usuarios"
                variant="text"
                startIcon={<Icon icon="mdi:arrow-left" />}
                sx={{ textTransform: "none", fontWeight: 800, px: 0 }}
              >
                {headerTitle}
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                disabled={String(accountStatus).toLowerCase() === "blocked"}
                onClick={() => {
                  if (String(accountStatus).toLowerCase() === "blocked") {
                    setSnackbar({
                      open: true,
                      severity: "error",
                      message:
                        "Debes desbloquear al usuario antes de suspenderlo.",
                    });
                    return;
                  }
                  setReasonAction("suspend");
                  setReasonText("");
                  setReasonOpen(true);
                }}
                sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2 }}
              >
                {String(accountStatus).toLowerCase() === "suspended"
                  ? "Reactivar"
                  : "Suspender"}
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  setReasonAction("block");
                  setReasonText("");
                  setReasonOpen(true);
                }}
                sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2 }}
              >
                {String(accountStatus).toLowerCase() === "blocked"
                  ? "Desbloquear"
                  : "Bloquear"}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => setDeleteOpen(true)}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
              >
                Eliminar
              </Button>
            </Stack>
          </Stack>

          <Typography color="text.secondary" sx={{ mt: -1 }}>
            Detalles del perfil del usuario
          </Typography>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {loading ? (
            <Typography color="text.secondary">Cargando…</Typography>
          ) : null}

          {showAccountStatus ? (
            <Stack direction="row" spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={`Estado: ${accountStatusLabel(accountStatus)}`}
                  size="small"
                  sx={{
                    ...accountStatusChipSx(accountStatus),
                    fontWeight: 900,
                    borderRadius: 2,
                  }}
                />
              </Stack>
              {statusChangeReason ? (
                <Typography variant="body2" color="text.secondary">
                  Motivo: {statusChangeReason}
                </Typography>
              ) : null}
            </Stack>
          ) : null}

          {doctor ? (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(15, 23, 42, 0.10)",
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={
                      doctor.profilePictureUrl ?? doctor.photoURL ?? undefined
                    }
                    sx={{ width: 109, height: 109 }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" fontWeight={900} noWrap>
                      {doctor.professionalName || doctor.displayName || "—"}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {doctorStatusChips(doctor.profileStatus).map((c) => (
                        <Chip
                          key={c.label}
                          label={c.label}
                          size="small"
                          sx={{
                            ...chipSx(c.tone),
                            fontWeight: 900,
                            borderRadius: 2,
                          }}
                        />
                      ))}
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mt: 1 }}
                    >
                      {(doctor.tags ?? []).slice(0, 8).map((t) => (
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
              </Box>

              <Divider />

              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  <Box component="span" sx={{ color: "primary.main", mr: 1 }}>
                    |
                  </Box>
                  Información General
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
                      <Stack direction="row" spacing={1.25} alignItems="center">
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
                          <Typography variant="body2" color="text.secondary">
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
                      <Stack direction="row" spacing={1.25} alignItems="center">
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
                          <Typography variant="body2" color="text.secondary">
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
                      <Stack direction="row" spacing={1.25} alignItems="center">
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
                          <Typography variant="body2" color="text.secondary">
                            {doctor.phone || "—"}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>

                    <Button
                      component={Link}
                      href={`/dashboard/verificaciones/${encodeURIComponent(doctor.userId)}?tab=documentos`}
                      variant="contained"
                      sx={{
                        alignSelf: "flex-start",
                        textTransform: "none",
                        fontWeight: 900,
                        borderRadius: 2,
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
                      Ver documentos
                    </Button>
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
                      <Stack direction="row" spacing={1.25} alignItems="center">
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
                        {Object.entries(doctor.availability ?? {}).map(
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
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              </Box>
            </Paper>
          ) : null}

          {patient ? (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(15, 23, 42, 0.10)",
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={patient.profilePictureUrl ?? undefined}
                    sx={{ width: 109, height: 109 }}
                  />
                  <Stack spacing={1}>
                    <Typography variant="h5" fontWeight={900}>
                      {patient.displayName || "—"}
                    </Typography>
                    <Chip
                      label="Paciente"
                      size="small"
                      sx={{
                        alignSelf: "flex-start",
                        bgcolor: "rgba(27, 94, 167, 0.10)",
                        color: "primary.main",
                        fontWeight: 900,
                        borderRadius: 2,
                      }}
                    />
                  </Stack>
                </Stack>
              </Box>
              <Divider />
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  <Box component="span" sx={{ color: "primary.main", mr: 1 }}>
                    |
                  </Box>
                  Información Principal
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: 2,
                  }}
                >
                  {[
                    {
                      label: "Género",
                      value: genderLabel(patient.gender),
                      icon: "mdi:account",
                    },
                    {
                      label: "Correo",
                      value: patient.email,
                      icon: "mdi:email-outline",
                    },
                    {
                      label: "Teléfono",
                      value: patient.phone || "—",
                      icon: "mdi:phone-outline",
                    },
                  ].map((c) => (
                    <Paper
                      key={c.label}
                      variant="outlined"
                      sx={{
                        borderRadius: 2.5,
                        p: 1.5,
                        bgcolor: "#F3F8FB",
                        borderColor: "rgba(15, 23, 42, 0.06)",
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="center">
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
                          <Icon icon={c.icon} />
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {c.label}
                          </Typography>
                          <Typography variant="body2" fontWeight={900}>
                            {c.value}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                    mt: 2,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      p: 2,
                      borderColor: "rgba(15, 23, 42, 0.08)",
                    }}
                  >
                    <Typography fontWeight={900} sx={{ mb: 1 }}>
                      Antecedentes Médicos
                    </Typography>
                    <Box
                      sx={{
                        mt: 1.5,
                        borderRadius: 2.5,
                        overflow: "hidden",
                        bgcolor: "#F7FAFC",
                        border: "1px solid rgba(15, 23, 42, 0.06)",
                      }}
                    >
                      {[
                        ["Hábito de fumar", frequencyLabel(patient.smoke)],
                        ["Consumo de alcohol", frequencyLabel(patient.alcohol)],
                        ["Alergias", patient.allergies || "—"],
                        ["Enfermedades", patient.diseases || "—"],
                      ].map(([k, v], idx, arr) => (
                        <Box key={k}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              px: 2,
                              py: 1.25,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {k}
                            </Typography>
                            <Typography variant="body2" fontWeight={900}>
                              {v}
                            </Typography>
                          </Box>
                          {idx < arr.length - 1 ? (
                            <Divider
                              sx={{ borderColor: "rgba(15, 23, 42, 0.06)" }}
                            />
                          ) : null}
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                  <Paper
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      p: 2,
                      borderColor: "rgba(15, 23, 42, 0.08)",
                    }}
                  >
                    <Typography fontWeight={900} sx={{ mb: 1 }}>
                      Salud Dental
                    </Typography>
                    <Box
                      sx={{
                        mt: 1.5,
                        borderRadius: 2.5,
                        overflow: "hidden",
                        bgcolor: "#F7FAFC",
                        border: "1px solid rgba(15, 23, 42, 0.06)",
                      }}
                    >
                      {[
                        [
                          "Frecuencia de cepillado",
                          patient.brushCount
                            ? `${patient.brushCount} veces al día`
                            : "—",
                        ],
                        ["Última consulta", formatDate(patient.lastDental)],
                      ].map(([k, v], idx, arr) => (
                        <Box key={k}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              px: 2,
                              py: 1.25,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {k}
                            </Typography>
                            <Typography variant="body2" fontWeight={900}>
                              {v}
                            </Typography>
                          </Box>
                          {idx < arr.length - 1 ? (
                            <Divider
                              sx={{ borderColor: "rgba(15, 23, 42, 0.06)" }}
                            />
                          ) : null}
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Box>
              </Box>
            </Paper>
          ) : null}

          {user ? (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "rgba(15, 23, 42, 0.10)",
                p: { xs: 2, sm: 3 },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={user.profilePictureUrl ?? undefined}
                  sx={{ width: 56, height: 56 }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={900} noWrap>
                    {user.displayName}
                  </Typography>
                  <Typography color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                  <Chip
                    label={String(user.role)}
                    size="small"
                    sx={{
                      mt: 1,
                      bgcolor: "rgba(0,0,0,0.06)",
                      fontWeight: 900,
                      borderRadius: 2,
                    }}
                  />
                </Box>
              </Stack>
            </Paper>
          ) : null}

          <Dialog
            open={reasonOpen}
            onClose={() => {
              if (reasonSaving) return;
              setReasonOpen(false);
              setReasonAction(null);
              setReasonText("");
            }}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle sx={{ fontWeight: 900 }}>
              {reasonAction === "suspend"
                ? String(accountStatus).toLowerCase() === "suspended"
                  ? "Reactivar usuario"
                  : "Suspender usuario"
                : String(accountStatus).toLowerCase() === "blocked"
                  ? "Desbloquear usuario"
                  : "Bloquear usuario"}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={1.25} sx={{ mt: 0.5 }}>
                <Typography color="text.secondary">
                  Indica el motivo (se registrará como razón de la acción).
                </Typography>
                <TextField
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder='Ej: "Incumplimiento de términos de servicio"'
                  multiline
                  minRows={3}
                  fullWidth
                  autoFocus
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                variant="text"
                disabled={reasonSaving}
                onClick={() => {
                  setReasonOpen(false);
                  setReasonAction(null);
                  setReasonText("");
                }}
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                disabled={reasonSaving || !reasonAction}
                onClick={() => {
                  if (!reasonAction) return;
                  void (async () => {
                    setReasonSaving(true);
                    try {
                      await runToggle(reasonAction, reasonText);
                      setSnackbar({
                        open: true,
                        severity: "success",
                        message: "Acción realizada correctamente.",
                      });
                      setReasonOpen(false);
                      setReasonAction(null);
                      setReasonText("");
                      await fetchUser();
                    } catch (err) {
                      const message =
                        err instanceof Error
                          ? err.message
                          : "Ocurrió un error.";
                      setSnackbar({
                        open: true,
                        severity: "error",
                        message,
                      });
                    } finally {
                      setReasonSaving(false);
                    }
                  })();
                }}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
              >
                Confirmar
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={deleteOpen}
            onClose={() => {
              if (deleteSaving) return;
              setDeleteOpen(false);
            }}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle sx={{ fontWeight: 900 }}>Eliminar usuario</DialogTitle>
            <DialogContent>
              <Alert severity="warning">
                Esta acción es permanente. ¿Deseas eliminar este usuario?
              </Alert>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                variant="text"
                disabled={deleteSaving}
                onClick={() => setDeleteOpen(false)}
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={deleteSaving}
                onClick={() => {
                  void (async () => {
                    setDeleteSaving(true);
                    try {
                      await runDelete();
                      setSnackbar({
                        open: true,
                        severity: "success",
                        message: "Usuario eliminado correctamente.",
                      });
                      setDeleteOpen(false);
                      void router.push("/dashboard/usuarios");
                    } catch (err) {
                      const message =
                        err instanceof Error
                          ? err.message
                          : "Ocurrió un error.";
                      setSnackbar({
                        open: true,
                        severity: "error",
                        message,
                      });
                    } finally {
                      setDeleteSaving(false);
                    }
                  })();
                }}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
              >
                Eliminar
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={4500}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              severity={snackbar.severity}
              variant="filled"
              onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
              sx={{ fontWeight: 800 }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Stack>
      </DashboardLayout>
    </AdminGuard>
  );
}
