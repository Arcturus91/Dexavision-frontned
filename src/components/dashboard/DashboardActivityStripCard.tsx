import { Icon } from "@iconify/react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import React from "react";

type DashboardActivityStripCardProps = {
  title: string;
  value: number | null;
  icon: string;
};

const GRADIENT =
  "linear-gradient(155.07deg, #0B5ED7 50.53%, #5DDCFF 100.53%)";
const ACCENT = "#0B5ED7";

export function DashboardActivityStripCard(props: DashboardActivityStripCardProps) {
  const { title, value, icon } = props;

  return (
    <Paper
      variant="outlined"
      sx={{
        position: "relative",
        overflow: "hidden",
        height: "100%",
        minHeight: 64,
        borderRadius: "8px",
        px: 1.5,
        py: 1.25,
        boxShadow: "0px 2px 6px 0px #00000040",
        border: "1px solid transparent",
        background:
          "linear-gradient(#fff, #fff) padding-box, linear-gradient(155.07deg, #0B5ED7 50.53%, #5DDCFF 100.53%) border-box",
        bgcolor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          right: -2,
          top: -2,
          opacity: 0.18,
          color: ACCENT,
          pointerEvents: "none",
        }}
      >
        <Icon icon={icon} width={52} height={52} />
      </Box>

      <Stack spacing={0.25} sx={{ pr: 5 }}>
        <Typography
          fontWeight={900}
          sx={{
            fontSize: 12,
            lineHeight: 1.2,
            letterSpacing: 0.2,
            backgroundImage: GRADIENT,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {title}
        </Typography>
        <Typography
          fontWeight={900}
          sx={{
            fontSize: 24,
            lineHeight: 1,
            backgroundImage: GRADIENT,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {typeof value === "number" ? value : "—"}
        </Typography>
      </Stack>

      <Box
        sx={{
          position: "absolute",
          right: 8,
          bottom: 8,
          width: 20,
          height: 20,
          borderRadius: "999px",
          display: "grid",
          placeItems: "center",
          bgcolor: "rgba(27,94,167,0.10)",
          color: ACCENT,
        }}
      >
        <Icon icon="mdi:arrow-right" width={11} height={11} />
      </Box>
    </Paper>
  );
}
