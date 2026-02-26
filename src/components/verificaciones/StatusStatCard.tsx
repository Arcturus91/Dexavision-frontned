import { Icon } from "@iconify/react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import React from "react";

type StatusStatCardProps = {
  title: string;
  value: number | null;
  icon: string;
  variant?: "filled" | "outlined";
  selected?: boolean;
  onClick?: () => void;
};

export function StatusStatCard(props: StatusStatCardProps) {
  const { title, value, icon, variant = "filled", selected = false, onClick } =
    props;

  const isFilled = variant === "filled";

  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        p: 2.25,
        cursor: onClick ? "pointer" : "default",
        borderColor: selected
          ? "rgba(27, 94, 167, 0.35)"
          : "rgba(15, 23, 42, 0.10)",
        bgcolor: isFilled ? "transparent" : "#fff",
        ...(isFilled
          ? {
              background:
                "linear-gradient(180deg, #2B7CCB 0%, #1B5EA7 100%)",
              color: "#fff",
            }
          : {}),
        outline: "none",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          right: 14,
          top: 16,
          opacity: isFilled ? 0.2 : 0.15,
          color: isFilled ? "#fff" : "#1B5EA7",
        }}
      >
        <Icon icon={icon} width={64} height={64} />
      </Box>

      <Stack spacing={1.25}>
        <Typography
          fontWeight={900}
          sx={{
            fontSize: 16,
            lineHeight: 1.2,
            maxWidth: 160,
          }}
        >
          {title}
        </Typography>
        <Typography
          fontWeight={900}
          sx={{ fontSize: 34, lineHeight: 1, color: isFilled ? "#fff" : "#1B5EA7" }}
        >
          {typeof value === "number" ? value : "—"}
        </Typography>
      </Stack>
    </Paper>
  );
}

