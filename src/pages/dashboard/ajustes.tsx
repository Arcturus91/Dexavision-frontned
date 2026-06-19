import { Alert, Button, Paper, Snackbar, Stack, TextField, Typography } from "@mui/material";
import Head from "next/head";
import React, { useEffect, useState } from "react";

import { AdminGuard } from "@/components/AdminGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

export default function AjustesPage() {
  const { getIdToken } = useAuth();
  const [limit, setLimit] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "error" }>({ open: false, msg: "", sev: "success" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await getIdToken();
        const resp = await fetch("/api/admin/lead-limit", { headers: { Authorization: `Bearer ${token}` } });
        const body = await resp.json().catch(() => null);
        if (!resp.ok || !body?.success) throw new Error("No se pudo cargar el límite.");
        if (!cancelled) setLimit(String(body.data.limit));
      } catch {
        if (!cancelled) setSnack({ open: true, msg: "No se pudo cargar el límite.", sev: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [getIdToken]);

  async function save() {
    setSaving(true);
    try {
      const n = Number(limit);
      if (!Number.isInteger(n) || n < 0) throw new Error("Ingrese un entero >= 0.");
      const token = await getIdToken();
      const resp = await fetch("/api/admin/lead-limit", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ limit: n }),
      });
      const body = await resp.json().catch(() => null);
      if (!resp.ok || !body?.success) throw new Error("No se pudo guardar.");
      setSnack({ open: true, msg: "Límite actualizado.", sev: "success" });
    } catch (e) {
      setSnack({ open: true, msg: e instanceof Error ? e.message : "Error al guardar.", sev: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminGuard>
      <Head><title>DexaVision | Ajustes</title></Head>
      <DashboardLayout>
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={900}>Ajustes</Typography>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.7)" }}>
            <Typography fontWeight={800} mb={1}>Configuración de Límites</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Leads gratuitos por doctor al mes"
                type="number" size="small" value={limit} disabled={loading || saving}
                onChange={(e) => setLimit(e.target.value)} sx={{ maxWidth: 280 }}
              />
              <Button variant="contained" onClick={save} disabled={loading || saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
            </Stack>
          </Paper>
        </Stack>
        <Snackbar open={snack.open} autoHideDuration={4500} onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity={snack.sev} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ fontWeight: 800 }}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </DashboardLayout>
    </AdminGuard>
  );
}
