/* eslint-disable @typescript-eslint/no-explicit-any */
import { Icon } from "@iconify/react";
import {
  Box,
  Button,
  Chip,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";

import { AdminGuard } from "@/components/AdminGuard";
import { DexaDataGrid } from "@/components/tables/DexaDataGrid";
import { StatusStatCard } from "@/components/verificaciones/StatusStatCard";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import type {
  Doctor,
  DoctorsResponse,
  DoctorProfileStatus,
} from "@/types/doctors";

type StatusFilter =
  | "incomplete"
  | "in_review"
  | "approved"
  | "rejected"
  | "all";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function statusChip(status: DoctorProfileStatus) {
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

function pickDoctor(d: any): Doctor {
  return {
    userId: String(d.userId ?? ""),
    email: String(d.email ?? ""),
    displayName: String(d.displayName ?? ""),
    photoURL: d.photoURL ?? null,
    professionalName: String(d.professionalName ?? ""),
    displayEmail: String(d.displayEmail ?? d.email ?? ""),
    profileStatus: String(d.profileStatus ?? ""),
    submittedAt: typeof d.submittedAt === "string" ? d.submittedAt : null,
  };
}

export default function VerificacionesPage() {
  const { getIdToken } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchValue, setSearchValue] = useState("");

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [rows, setRows] = useState<Doctor[]>([]);
  const [rowCount, setRowCount] = useState<number>(-1);
  const [loading, setLoading] = useState(false);
  const [paginationMeta, setPaginationMeta] = useState<{
    hasNextPage?: boolean;
  }>({});

  const [cursorsByPage, setCursorsByPage] = useState<
    Record<number, { afterCursor: string | null; beforeCursor: string | null }>
  >({});
  const [cursorParams, setCursorParams] = useState<{
    after?: string;
    before?: string;
  }>({});

  const [counts, setCounts] = useState<{
    in_review: number | null;
    incomplete: number | null;
    approved: number | null;
    rejected: number | null;
  }>({ in_review: null, incomplete: null, approved: null, rejected: null });

  const [filtersAnchor, setFiltersAnchor] = useState<HTMLElement | null>(null);

  const limit = paginationModel.pageSize;

  const columns = useMemo(() => {
    const cols: GridColDef<Doctor>[] = [
      {
        field: "displayName",
        headerName: "Nombre del Doctor",
        flex: 1.3,
        minWidth: 260,
        sortable: false,
        renderCell: (params: any) => {
          const d = params.row as Doctor;
          return (
            <Stack sx={{ py: 1 }}>
              <Typography fontWeight={800}>{d.displayName || "—"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {d.displayEmail || d.email || "—"}
              </Typography>
            </Stack>
          );
        },
      },
      {
        field: "submittedAt",
        headerName: "Fecha de envío",
        flex: 0.8,
        minWidth: 170,
        sortable: false,
        valueGetter: (value: any, row: any) => {
          const d = row as Doctor;
          return formatDate(d.submittedAt);
        },
      },
      {
        field: "profileStatus",
        headerName: "Estado",
        flex: 0.8,
        minWidth: 200,
        sortable: false,
        renderCell: (params: any) => {
          const d = params.row as Doctor;
          const s = statusChip(d.profileStatus);
          return (
            <Chip
              label={s.label}
              size="small"
              sx={{
                bgcolor: s.bg,
                color: s.fg,
                fontWeight: 800,
                borderRadius: 2,
              }}
            />
          );
        },
      },
      {
        field: "action",
        headerName: "Acción",
        flex: 0.5,
        minWidth: 140,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params: any) => {
          const d = params.row as Doctor;
          return (
            <Button
              variant="outlined"
              size="small"
              onClick={() =>
                void router.push(
                  `/dashboard/verificaciones/${encodeURIComponent(d.userId)}`,
                )
              }
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 2,
              }}
            >
              Revisar
            </Button>
          );
        },
      },
    ];
    return cols;
  }, []);

  function resetPagination(nextPageSize = paginationModel.pageSize) {
    setPaginationModel({ page: 0, pageSize: nextPageSize });
    setCursorParams({});
    setCursorsByPage({});
    setPaginationMeta({});
  }

  function handlePaginationModelChange(model: {
    page: number;
    pageSize: number;
  }) {
    if (model.pageSize !== paginationModel.pageSize) {
      resetPagination(model.pageSize);
      return;
    }

    if (model.page === paginationModel.page) return;

    if (model.page > paginationModel.page) {
      const after = cursorsByPage[paginationModel.page]?.afterCursor ?? null;
      if (!after) return;
      setCursorParams({ after });
      setPaginationModel(model);
      return;
    }

    if (model.page === 0) {
      setCursorParams({});
      setPaginationModel(model);
      return;
    }

    const before = cursorsByPage[paginationModel.page]?.beforeCursor ?? null;
    if (!before) return;
    setCursorParams({ before });
    setPaginationModel(model);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const token = await getIdToken();
        if (!token) {
          setRows([]);
          setRowCount(-1);
          return;
        }

        const qs = new URLSearchParams({
          status,
          limit: String(limit),
        });
        if (cursorParams.after) qs.set("after", cursorParams.after);
        if (cursorParams.before) qs.set("before", cursorParams.before);

        const resp = await fetch(`/api/admin/doctors?${qs.toString()}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const body = (await resp.json().catch(() => null)) as unknown;
        if (!resp.ok) throw new Error("No se pudieron cargar los doctores.");
        if (
          !body ||
          typeof body !== "object" ||
          !("success" in body) ||
          !("data" in body)
        ) {
          throw new Error("Respuesta inesperada del servidor.");
        }

        const parsed = body as DoctorsResponse;
        const doctors = Array.isArray(parsed.data?.doctors)
          ? parsed.data.doctors.map(pickDoctor)
          : [];

        if (cancelled) return;
        setRows(doctors);
        setRowCount(-1);

        const pagination = parsed.data?.pagination;
        const afterCursor = pagination?.afterCursor ?? null;
        const beforeCursor = pagination?.beforeCursor ?? null;
        setCursorsByPage((prev) => ({
          ...prev,
          [paginationModel.page]: { afterCursor, beforeCursor },
        }));
        setPaginationMeta({ hasNextPage: Boolean(afterCursor) });

        const nextCounts = parsed.data?.counts;
        if (nextCounts) {
          setCounts({
            in_review: nextCounts.in_review,
            incomplete: nextCounts.incomplete,
            approved: nextCounts.approved,
            rejected: nextCounts.rejected,
          });
        }
      } catch {
        if (cancelled) return;
        setRows([]);
        setRowCount(-1);
        setPaginationMeta({});
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    cursorParams.after,
    cursorParams.before,
    getIdToken,
    limit,
    paginationModel.page,
    status,
  ]);

  return (
    <AdminGuard>
      <Head>
        <title>DexaVision | Verificaciones</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardLayout>
        <Stack spacing={2.25}>
          <Stack spacing={0.75}>
            <Typography variant="h4" fontWeight={900}>
              Verificación de profesionales
            </Typography>
            <Typography color="text.secondary">
              Revisa, valida o solicita correcciones a los documentos enviados
              por doctores.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            <StatusStatCard
              title="Pendientes de revisión"
              value={counts.in_review}
              icon="mdi:clipboard-text-clock-outline"
              variant="filled"
              selected={status === "in_review"}
              onClick={() => {
                setStatus("in_review");
                resetPagination();
              }}
            />
            <StatusStatCard
              title="Requieren corrección"
              value={counts.incomplete}
              icon="mdi:alert-outline"
              variant="filled"
              selected={status === "incomplete"}
              onClick={() => {
                setStatus("incomplete");
                resetPagination();
              }}
            />
            <StatusStatCard
              title="Aprobados"
              value={counts.approved}
              icon="mdi:check-bold"
              variant="outlined"
              selected={status === "approved"}
              onClick={() => {
                setStatus("approved");
                resetPagination();
              }}
            />
          </Box>

          <DexaDataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => (row as Doctor).userId}
            loading={loading}
            rowCount={rowCount}
            paginationModel={paginationModel}
            paginationMeta={paginationMeta}
            onPaginationModelChange={handlePaginationModelChange as any}
            searchValue={searchValue}
            onSearchValueChange={setSearchValue}
            onOpenFilters={(anchorEl) => setFiltersAnchor(anchorEl)}
          />

          <Menu
            anchorEl={filtersAnchor}
            open={Boolean(filtersAnchor)}
            onClose={() => setFiltersAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            {(
              [
                ["in_review", "Pendiente"],
                ["incomplete", "Corrección necesaria"],
                ["approved", "Aprobado"],
                ["rejected", "Rechazado"],
                ["all", "Todos"],
              ] as Array<[StatusFilter, string]>
            ).map(([value, label]) => (
              <MenuItem
                key={value}
                selected={status === value}
                onClick={() => {
                  setFiltersAnchor(null);
                  setStatus(value);
                  resetPagination();
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Icon
                    icon={status === value ? "mdi:check" : "mdi:chevron-right"}
                    width={18}
                    height={18}
                  />
                  <span>{label}</span>
                </Stack>
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      </DashboardLayout>
    </AdminGuard>
  );
}
