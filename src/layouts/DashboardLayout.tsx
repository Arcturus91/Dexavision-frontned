import { Icon } from "@iconify/react";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";

const drawerWidth = 280;

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const chars = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return chars.join("") || "U";
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const router = useRouter();
  const { signOut } = useAuth();
  const { profile } = useProfile();

  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo<NavItem[]>(
    () => [
      { label: "Dashboard", href: "/dashboard", icon: "mdi:view-dashboard" },
      {
        label: "Verificaciones",
        href: "/dashboard/verificaciones",
        icon: "mdi:shield-check",
      },
      {
        label: "Usuarios",
        href: "/dashboard/usuarios",
        icon: "mdi:account-multiple",
      },
      {
        label: "Suscripciones",
        href: "/dashboard/suscripciones",
        icon: "mdi:credit-card-outline",
      },
      { label: "Ajustes", href: "/dashboard/ajustes", icon: "mdi:cog-outline" },
    ],
    [],
  );

  const currentPath = router.pathname;

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#EDF4F7",
      }}
    >
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Typography variant="h6" fontWeight={900}>
          DexaVision
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Panel administrativo
        </Typography>
      </Box>

      <List sx={{ px: 1.5 }}>
        {navItems.map((item) => {
          const selected =
            currentPath === item.href ||
            (item.href !== "/dashboard" && currentPath.startsWith(item.href));

          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={selected}
              onClick={() => setMobileOpen(false)}
              sx={{
                mb: 0.75,
                borderRadius: 2,
                px: 2,
                py: 1.1,
                "&.Mui-selected": {
                  background:
                    "linear-gradient(180deg, #2B7CCB 0%, #1B5EA7 100%)",
                  color: "#fff",
                },
                "&.Mui-selected:hover": {
                  background:
                    "linear-gradient(180deg, #2B7CCB 0%, #184F8C 100%)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: selected ? "#fff" : "text.secondary",
                }}
              >
                <Icon icon={item.icon} width={20} height={20} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: selected ? 900 : 700,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ px: 2.5, pb: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={profile?.profilePicture ?? undefined}
            sx={{
              width: 44,
              height: 44,
              bgcolor: "rgba(27, 94, 167, 0.16)",
              color: "primary.main",
              fontWeight: 800,
            }}
          >
            {initials(profile?.displayName ?? "Usuario")}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography fontWeight={800} noWrap>
              {profile?.displayName ?? "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {profile?.role === "admin"
                ? "Administrador principal"
                : (profile?.role ?? "—")}
            </Typography>
          </Box>
          <IconButton
            aria-label="Cerrar sesión"
            onClick={() => void signOut()}
            sx={{ color: "error.main" }}
          >
            <Icon icon="mdi:logout-variant" width={20} height={20} />
          </IconButton>
        </Stack>

        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{ mt: 1.5 }}
        >
          <Typography variant="body2" color="error.main" fontWeight={700}>
            Cerrar sesión
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Salir de la sesión
          </Typography>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#fff" }}>
      {!isMdUp ? (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: "rgba(255,255,255,0.92)",
            color: "text.primary",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
              sx={{ mr: 1 }}
            >
              <Icon icon="mdi:menu" width={22} height={22} />
            </IconButton>
            <Typography fontWeight={900}>DexaVision</Typography>
          </Toolbar>
        </AppBar>
      ) : null}

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMdUp ? "permanent" : "temporary"}
          open={isMdUp ? true : mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              borderRight: "1px solid rgba(0,0,0,0.06)",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: "#fff",
          pt: { xs: 8, md: 0 },
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, md: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
