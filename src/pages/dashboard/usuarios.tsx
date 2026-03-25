/* eslint-disable @typescript-eslint/no-explicit-any */
import { Icon } from "@iconify/react";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";

import { AdminGuard } from "@/components/AdminGuard";
import { DexaDataGrid } from "@/components/tables/DexaDataGrid";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import type { AdminUser, AdminUsersResponse, UserRole } from "@/types/users";

type RoleFilter = "patient" | "doctor" | "admin" | "all";

function roleLabel(role: UserRole): string {
  switch (role) {
    case "patient":
      return "Paciente";
    case "doctor":
      return "Doctor";
    case "admin":
      return "Admin";
    default:
      return role;
  }
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

function errorMessageFromBody(body: any): string {
  const msg = body?.error?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (typeof body?.error === "string" && body.error.trim()) return body.error;
  return "Ocurrió un error.";
}

function pickUser(u: any): AdminUser {
  return {
    userId: String(u.userId ?? ""),
    email: String(u.email ?? ""),
    displayName: String(u.displayName ?? ""),
    role: String(u.role ?? ""),
    accountStatus:
      u?.accountStatus === null || typeof u?.accountStatus === "string"
        ? (u.accountStatus ?? undefined)
        : undefined,
    createdAt: String(u.createdAt ?? ""),
    updatedAt: String(u.updatedAt ?? ""),
  };
}

export default function UsuariosPage() {
  const { getIdToken } = useAuth();
  const router = useRouter();

  const [role, setRole] = useState<RoleFilter>("all");
  const [searchValue, setSearchValue] = useState("");

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [rows, setRows] = useState<AdminUser[]>([]);
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

  const [filtersAnchor, setFiltersAnchor] = useState<HTMLElement | null>(null);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const [actionsUserId, setActionsUserId] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

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

  const limit = paginationModel.pageSize;

  const selectedUser = useMemo(() => {
    if (!actionsUserId) return null;
    return rows.find((r) => r.userId === actionsUserId) ?? null;
  }, [actionsUserId, rows]);

  const columns = useMemo(() => {
    const cols: GridColDef<AdminUser>[] = [
      {
        field: "displayName",
        headerName: "Nombre",
        flex: 1.2,
        minWidth: 260,
        sortable: false,
        renderCell: (params: any) => {
          const u = params.row as AdminUser;
          return (
            <Stack sx={{ py: 1 }}>
              <Typography fontWeight={800}>{u.displayName || "—"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {u.email || "—"}
              </Typography>
            </Stack>
          );
        },
      },
      {
        field: "role",
        headerName: "Tipo",
        flex: 0.65,
        minWidth: 140,
        sortable: false,
        valueGetter: (_: any, row: any) => {
          const u = row as AdminUser;
          return roleLabel(u.role);
        },
      },
      {
        field: "plan",
        headerName: "Plan actual",
        flex: 0.8,
        minWidth: 160,
        sortable: false,
        renderCell: () => (
          <Typography color="text.secondary" fontWeight={700}>
            —
          </Typography>
        ),
      },
      {
        field: "updatedAt",
        headerName: "Última actividad",
        flex: 0.8,
        minWidth: 180,
        sortable: false,
        valueGetter: (_: any, row: any) => {
          const u = row as AdminUser;
          return formatDate(u.updatedAt);
        },
      },
      {
        field: "estado",
        headerName: "Estado",
        flex: 0.8,
        minWidth: 150,
        sortable: false,
        renderCell: (params: any) => {
          const u = params.row as AdminUser;
          return (
            <Chip
              label={accountStatusLabel(u.accountStatus)}
              size="small"
              sx={{
                ...accountStatusChipSx(u.accountStatus),
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
        flex: 0.6,
        minWidth: 170,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params: any) => {
          const u = params.row as AdminUser;
          return (
            <Button
              variant="outlined"
              size="small"
              endIcon={<Icon icon="mdi:chevron-down" />}
              onClick={(e) => {
                setActionsUserId(u.userId);
                setActionsAnchor(e.currentTarget);
              }}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 2,
              }}
            >
              Acciones
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
          role,
          limit: String(limit),
        });
        if (cursorParams.after) qs.set("after", cursorParams.after);
        if (cursorParams.before) qs.set("before", cursorParams.before);

        const resp = await fetch(`/api/admin/users?${qs.toString()}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const body = (await resp.json().catch(() => null)) as unknown;
        if (!resp.ok) throw new Error("No se pudieron cargar los usuarios.");
        if (!body || typeof body !== "object" || !("data" in body)) {
          throw new Error("Respuesta inesperada del servidor.");
        }

        const parsed = body as AdminUsersResponse;
        const users = Array.isArray(parsed.data?.users)
          ? parsed.data.users.map(pickUser)
          : [];

        if (cancelled) return;
        setRows(users);
        setRowCount(-1);

        const pagination = parsed.data?.pagination;
        const afterCursor = pagination?.afterCursor ?? null;
        const beforeCursor = pagination?.beforeCursor ?? null;
        setCursorsByPage((prev) => ({
          ...prev,
          [paginationModel.page]: { afterCursor, beforeCursor },
        }));
        setPaginationMeta({ hasNextPage: Boolean(afterCursor) });
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
    role,
    reloadKey,
  ]);

  async function runToggle(action: "suspend" | "block", userId: string, reason: string) {
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

  async function runDelete(userId: string) {
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
        <title>DexaVision | Usuarios</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardLayout>
        <Stack spacing={2.25}>
          <Stack spacing={0.75}>
            <Typography variant="h4" fontWeight={900}>
              Usuarios
            </Typography>
            <Typography color="text.secondary">
              Revisa, valida o solicita correcciones a los documentos enviados
              por doctores.
            </Typography>
          </Stack>

          <DexaDataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => (row as AdminUser).userId}
            loading={loading}
            rowCount={rowCount}
            paginationMeta={paginationMeta}
            paginationModel={paginationModel}
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
                ["all", "Todos"],
                ["patient", "Pacientes"],
                ["doctor", "Doctores"],
                ["admin", "Admins"],
              ] as Array<[RoleFilter, string]>
            ).map(([value, label]) => (
              <MenuItem
                key={value}
                selected={role === value}
                onClick={() => {
                  setFiltersAnchor(null);
                  setRole(value);
                  resetPagination();
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Icon
                    icon={role === value ? "mdi:check" : "mdi:chevron-right"}
                    width={18}
                    height={18}
                  />
                  <span>{label}</span>
                </Stack>
              </MenuItem>
            ))}
          </Menu>

          <Menu
            anchorEl={actionsAnchor}
            open={Boolean(actionsAnchor)}
            onClose={() => {
              setActionsAnchor(null);
              setActionsUserId(null);
            }}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            <MenuItem
              disabled={
                String(selectedUser?.accountStatus ?? "").toLowerCase() ===
                "blocked"
              }
              onClick={() => {
                if (!actionsUserId) return;
                const s = String(selectedUser?.accountStatus ?? "").toLowerCase();
                if (s === "blocked") {
                  setSnackbar({
                    open: true,
                    severity: "error",
                    message: "Debes desbloquear al usuario antes de suspenderlo.",
                  });
                  return;
                }
                setReasonAction("suspend");
                setReasonText("");
                setReasonOpen(true);
                setActionsAnchor(null);
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Icon icon="mdi:pause-circle-outline" width={18} height={18} />
                <span>
                  {String(selectedUser?.accountStatus ?? "").toLowerCase() ===
                  "suspended"
                    ? "Reactivar"
                    : "Suspender"}
                </span>
              </Stack>
            </MenuItem>

            <MenuItem
              onClick={() => {
                if (!actionsUserId) return;
                setReasonAction("block");
                setReasonText("");
                setReasonOpen(true);
                setActionsAnchor(null);
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Icon icon="mdi:block-helper" width={18} height={18} />
                <span>
                  {String(selectedUser?.accountStatus ?? "").toLowerCase() ===
                  "blocked"
                    ? "Desbloquear"
                    : "Bloquear"}
                </span>
              </Stack>
            </MenuItem>

            <MenuItem
              onClick={() => {
                if (actionsUserId) {
                  void router.push(
                    `/dashboard/usuarios/${encodeURIComponent(actionsUserId)}`,
                  );
                }
                setActionsAnchor(null);
                setActionsUserId(null);
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Icon icon="mdi:account-outline" width={18} height={18} />
                <span>Ver usuario</span>
              </Stack>
            </MenuItem>

            <MenuItem
              onClick={() => {
                if (!actionsUserId) return;
                setDeleteOpen(true);
                setActionsAnchor(null);
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Icon icon="mdi:trash-can-outline" width={18} height={18} />
                <span>Eliminar usuario</span>
              </Stack>
            </MenuItem>
          </Menu>

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
                ? String(selectedUser?.accountStatus ?? "").toLowerCase() ===
                  "suspended"
                  ? "Reactivar usuario"
                  : "Suspender usuario"
                : String(selectedUser?.accountStatus ?? "").toLowerCase() ===
                    "blocked"
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
                disabled={reasonSaving || !actionsUserId || !reasonAction}
                onClick={() => {
                  if (!actionsUserId || !reasonAction) return;
                  void (async () => {
                    setReasonSaving(true);
                    try {
                      await runToggle(reasonAction, actionsUserId, reasonText);
                      setSnackbar({
                        open: true,
                        severity: "success",
                        message: "Acción realizada correctamente.",
                      });
                      setReasonOpen(false);
                      setReasonAction(null);
                      setReasonText("");
                      setActionsUserId(null);
                      setReloadKey((k) => k + 1);
                    } catch (err) {
                      const message =
                        err instanceof Error ? err.message : "Ocurrió un error.";
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
                disabled={deleteSaving || !actionsUserId}
                onClick={() => {
                  if (!actionsUserId) return;
                  void (async () => {
                    setDeleteSaving(true);
                    try {
                      await runDelete(actionsUserId);
                      setSnackbar({
                        open: true,
                        severity: "success",
                        message: "Usuario eliminado correctamente.",
                      });
                      setDeleteOpen(false);
                      setActionsAnchor(null);
                      setActionsUserId(null);
                      setReloadKey((k) => k + 1);
                    } catch (err) {
                      const message =
                        err instanceof Error ? err.message : "Ocurrió un error.";
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
