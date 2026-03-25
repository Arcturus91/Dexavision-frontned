import { Icon } from "@iconify/react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import React from "react";

type DashboardKpiCardProps = {
  title: string;
  value: number | null;
  icon: string;
  variant?: "filled" | "outlined";
};

export function DashboardKpiCard(props: DashboardKpiCardProps) {
  const { title, value, icon, variant = "filled" } = props;
  const isFilled = variant === "filled";
  const borderGradient =
    "linear-gradient(155.07deg, #0B5ED7 50.53%, #5DDCFF 100.53%)";
  const outlinedTextColor = "#0B5ED7"; // fallback for non-text-gradient elements

  return (
    <Paper
      variant="outlined"
      sx={{
        height: 140,
        position: "relative",
        overflow: "hidden",
        maxWidth: 250,
        borderRadius: "8px",
        p: 2,
        boxShadow: "0px 2px 6px 0px #00000040",
        ...(isFilled
          ? {
              border: "none",
              bgcolor: "#fff",
            }
          : {
              // Gradient border (use border-image-source as requested; background layers preserve radius)
              border: "1px solid transparent",
              borderImageSlice: 1,
              background:
                "linear-gradient(#fff, #fff) padding-box, linear-gradient(155.07deg, #0B5ED7 50.53%, #5DDCFF 100.53%) border-box",
              bgcolor: "transparent",
            }),
        ...(isFilled
          ? {
              background: "linear-gradient(180deg, #0688D3 24%, #03466D 100%)",
              color: "#fff",
            }
          : {}),
      }}
    >
      <Box
        sx={{
          position: "absolute",
          right: 0,
          top: 0,
          opacity: isFilled ? 0.22 : 0.15,
          color: isFilled ? "#fff" : outlinedTextColor,
        }}
      >
        <Icon icon={icon} width={108} height={108} />
      </Box>

      <Stack spacing={1.1}>
        <Typography
          fontWeight={900}
          sx={{
            fontSize: 16,
            lineHeight: 1.2,
            maxWidth: 180,
            ...(isFilled
              ? { color: "#fff" }
              : {
                  backgroundImage: borderGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }),
          }}
        >
          {title}
        </Typography>
        <Typography
          fontWeight={900}
          sx={{
            fontSize: 34,
            lineHeight: 1,
            ...(isFilled
              ? { color: "#fff" }
              : {
                  backgroundImage: borderGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }),
          }}
        >
          {typeof value === "number" ? value : "—"}
        </Typography>
      </Stack>

      <Box
        sx={{
          position: "absolute",
          right: 14,
          bottom: 14,
          width: 28,
          height: 28,
          borderRadius: "999px",
          display: "grid",
          placeItems: "center",
          bgcolor: isFilled ? "rgba(255,255,255,0.18)" : "rgba(27,94,167,0.10)",
          color: isFilled ? "#fff" : outlinedTextColor,
        }}
      >
        <Icon icon="mdi:arrow-right" width={16} height={16} />
      </Box>
    </Paper>
  );
}
