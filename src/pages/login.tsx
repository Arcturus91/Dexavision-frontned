import { Icon } from "@iconify/react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";

import { GuestGuard } from "@/components/GuestGuard";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

function errorMessage(err: unknown): string {
  const code =
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code?: unknown }).code === "string"
      ? (err as { code: string }).code
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "El correo electrónico no es válido.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta de nuevo más tarde.";
    case "auth/popup-closed-by-user":
      return "Se cerró la ventana de Google antes de finalizar.";
    case "auth/popup-blocked":
      return "El navegador bloqueó el popup. Habilita popups e inténtalo de nuevo.";
    default:
      return "No se pudo iniciar sesión. Intenta nuevamente.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmailPassword, signInWithGoogle, firebaseConfigured } =
    useAuth();

  const nextPath = useMemo(() => {
    const next =
      typeof router.query.next === "string" ? router.query.next : "/dashboard";
    return next.startsWith("/") ? next : "/dashboard";
  }, [router.query.next]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const reason =
    typeof router.query.reason === "string" ? router.query.reason : null;

  async function handleEmailPasswordSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      await signInWithEmailPassword(email.trim(), password);
      await router.replace(nextPath);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setFormError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      await router.replace(nextPath);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <GuestGuard>
      <Head>
        <title>DexaVision | Iniciar sesión</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          bgcolor: "background.default",
        }}
      >
        <Box
          sx={{
            flex: { xs: 1, md: 5 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 2, sm: 4 },
          }}
        >
          <Card
            elevation={0}
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: 4,
              border: "1px solid",
              borderColor: "rgba(0,0,0,0.06)",
              bgcolor: "background.paper",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={2.25}>
                <Stack spacing={0.75}>
                  <Typography variant="h5" fontWeight={800} textAlign="center">
                    Bienvenido de nuevo
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                  >
                    Inicia sesión para empezar a administrar en DexaVision.
                  </Typography>
                </Stack>

                {!firebaseConfigured ? (
                  <Alert severity="warning">
                    Firebase no está configurado. Agrega las variables{" "}
                    <strong>NEXT_PUBLIC_FIREBASE_*</strong> en tu{" "}
                    <strong>.env.local</strong>.
                  </Alert>
                ) : null}

                {reason === "not_admin" ? (
                  <Alert severity="error">
                    Tu usuario no tiene permisos para ingresar al panel.
                  </Alert>
                ) : null}

                {formError ? <Alert severity="error">{formError}</Alert> : null}

                <Box component="form" onSubmit={handleEmailPasswordSubmit}>
                  <Stack spacing={1.75}>
                    <TextField
                      label="Correo electrónico"
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      type="email"
                      fullWidth
                      disabled={busy}
                    />

                    <TextField
                      label="Contraseña"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      type={showPassword ? "text" : "password"}
                      fullWidth
                      disabled={busy}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showPassword
                                  ? "Ocultar contraseña"
                                  : "Mostrar contraseña"
                              }
                              onClick={() => setShowPassword((v) => !v)}
                              edge="end"
                              disabled={busy}
                            >
                              <Icon
                                icon={
                                  showPassword
                                    ? "mdi:eye-off-outline"
                                    : "mdi:eye-outline"
                                }
                              />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={busy || !firebaseConfigured}
                      sx={{
                        py: 1.25,
                        textTransform: "none",
                        fontWeight: 700,
                        background:
                          "linear-gradient(180deg, #2B7CCB 0%, #1B5EA7 100%)",
                        boxShadow: "none",
                        "&:hover": {
                          boxShadow: "none",
                          background:
                            "linear-gradient(180deg, #2B7CCB 0%, #184F8C 100%)",
                        },
                      }}
                      startIcon={
                        busy ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : undefined
                      }
                    >
                      Iniciar Sesión
                    </Button>

                    <Divider sx={{ color: "text.secondary", fontSize: 12 }}>
                      o ingresa con
                    </Divider>

                    <Button
                      type="button"
                      variant="outlined"
                      fullWidth
                      onClick={handleGoogle}
                      disabled={busy || !firebaseConfigured}
                      startIcon={<Icon icon="flat-color-icons:google" />}
                      sx={{
                        py: 1.1,
                        textTransform: "none",
                        fontWeight: 600,
                        borderColor: "rgba(0,0,0,0.12)",
                        "&:hover": { borderColor: "rgba(0,0,0,0.22)" },
                      }}
                    >
                      Sign Up with Google
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flex: 7,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url('/img/login_bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <Box
            sx={{
              position: "relative",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: "90px",
            }}
          >
            <Image
              src="/img/logo.svg"
              alt="DexaVision"
              width={543}
              height={100}
              style={{ width: "100%", height: "auto" }}
            />
          </Box>
        </Box>
      </Box>
    </GuestGuard>
  );
}
