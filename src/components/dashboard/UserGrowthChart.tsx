import { Box, Paper, Stack, Typography } from "@mui/material";
import React, { useMemo, useState } from "react";

type Point = { label: string; count: number };

type UserGrowthChartProps = {
  title: string;
  subtitle?: string;
  totalLabel: string;
  totalValue: number | null;
  points: Point[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function catmullRomToBezierPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }

  const p = points;
  const parts: string[] = [`M ${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`];

  // Catmull-Rom spline converted to cubic Béziers
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    parts.push(
      `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    );
  }

  return parts.join(" ");
}

export function UserGrowthChart(props: UserGrowthChartProps) {
  const { title, subtitle, totalLabel, totalValue, points } = props;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const svg = useMemo(() => {
    const w = 760;
    const h = 220;
    const padX = 40;
    const padY = 28;

    const safe = points.length ? points : [{ label: "—", count: 0 }];
    const maxY = Math.max(...safe.map((p) => p.count), 1);
    const minY = 0;

    const xStep = safe.length > 1 ? (w - padX * 2) / (safe.length - 1) : 0;

    const coords = safe.map((p, i) => {
      const x = padX + i * xStep;
      const y =
        padY + (1 - (p.count - minY) / (maxY - minY || 1)) * (h - padY * 2);
      return { ...p, x, y };
    });

    const d = catmullRomToBezierPath(coords);

    return { w, h, padX, padY, coords, d };
  }, [points]);

  const active =
    activeIndex === null ? null : (svg.coords[activeIndex] ?? null);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: "rgba(15, 23, 42, 0.10)",
        overflow: "hidden",
        bgcolor: "#fff",
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Stack spacing={0.25}>
          <Typography fontWeight={900}>{title}</Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Stack>

        <Stack spacing={0.25} sx={{ mt: 1.5 }}>
          <Typography variant="h5" fontWeight={900}>
            {typeof totalValue === "number" ? totalValue : "—"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {totalLabel}
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Box sx={{ minWidth: 760 }}>
            <svg
              viewBox={`0 0 ${svg.w} ${svg.h}`}
              width="100%"
              height={svg.h}
              style={{ display: "block" }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {/* grid */}
              {[0.25, 0.5, 0.75].map((t) => {
                const y = svg.padY + t * (svg.h - svg.padY * 2);
                return (
                  <line
                    key={t}
                    x1={svg.padX}
                    x2={svg.w - svg.padX}
                    y1={y}
                    y2={y}
                    stroke="rgba(15,23,42,0.06)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* line */}
              <path d={svg.d} fill="none" stroke="#2B7CCB" strokeWidth="2.5" />

              {/* points */}
              {svg.coords.map((c, i) => (
                <g
                  key={`${c.label}-${i}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onFocus={() => setActiveIndex(i)}
                >
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={activeIndex === i ? 6 : 4}
                    fill="#2B7CCB"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                </g>
              ))}

              {/* x labels */}
              {svg.coords.map((c, i) => (
                <text
                  key={`x-${c.label}-${i}`}
                  x={c.x}
                  y={svg.h - 8}
                  textAnchor="middle"
                  fill="rgba(15,23,42,0.55)"
                  fontSize="12"
                >
                  {c.label}
                </text>
              ))}
            </svg>

            {active ? (
              <Box
                sx={{
                  position: "relative",
                  height: 0,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    left: clamp((active.x / svg.w) * 100, 8, 88) + "%",
                    top: -svg.h + active.y - 54,
                    transform: "translateX(-50%)",
                    bgcolor: "#fff",
                    border: "1px solid rgba(15, 23, 42, 0.10)",
                    borderRadius: 2,
                    px: 1.25,
                    py: 0.75,
                    boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
                    pointerEvents: "none",
                    minWidth: 130,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {active.label}
                  </Typography>
                  <Typography fontWeight={900} sx={{ lineHeight: 1.1 }}>
                    {active.count} usuarios
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
