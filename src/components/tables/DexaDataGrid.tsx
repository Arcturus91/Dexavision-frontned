import { Icon } from "@iconify/react";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridPaginationMeta,
  GridRowIdGetter,
} from "@mui/x-data-grid";
import React from "react";

type DexaDataGridProps<R extends { [key: string]: unknown }> = {
  title?: string;
  subtitle?: string;
  rows: R[];
  columns: GridColDef<R>[];
  getRowId: GridRowIdGetter<R>;
  loading?: boolean;
  rowCount?: number;
  paginationMeta?: GridPaginationMeta;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onOpenFilters?: (anchorEl: HTMLElement) => void;
};

export function DexaDataGrid<R extends { [key: string]: unknown }>(
  props: DexaDataGridProps<R>,
) {
  const {
    title,
    subtitle,
    rows,
    columns,
    getRowId,
    loading = false,
    rowCount,
    paginationMeta,
    paginationModel,
    onPaginationModelChange,
    searchValue,
    onSearchValueChange,
    onOpenFilters,
  } = props;

  const serverPagination = typeof rowCount === "number" || Boolean(paginationMeta);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        borderColor: "rgba(15, 23, 42, 0.10)",
        bgcolor: "#fff",
      }}
    >
      {(title || subtitle) && (
        <Box sx={{ px: 3, pt: 2.5, pb: 0 }}>
          {title ? (
            <Typography variant="h6" fontWeight={900}>
              {title}
            </Typography>
          ) : null}
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      )}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ px: 3, pt: 2, pb: 2 }}
      >
        <TextField
          value={searchValue}
          onChange={(e) => onSearchValueChange(e.target.value)}
          placeholder="Busqueda"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <Box sx={{ display: "inline-flex", pr: 1, color: "text.secondary" }}>
                <Icon icon="mdi:magnify" width={20} height={20} />
              </Box>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#fff",
              borderRadius: 2,
            },
          }}
        />

        <Button
          variant="outlined"
          onClick={(e) => onOpenFilters?.(e.currentTarget)}
          disabled={!onOpenFilters}
          startIcon={<Icon icon="mdi:tune-variant" width={18} height={18} />}
          sx={{
            minWidth: { xs: "100%", sm: 140 },
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 800,
            borderColor: "rgba(15, 23, 42, 0.14)",
            bgcolor: "#fff",
          }}
        >
          Filtros
        </Button>
      </Stack>

      <Box sx={{ height: 560, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={getRowId}
          loading={loading}
          rowCount={serverPagination ? (rowCount ?? -1) : undefined}
          paginationMeta={paginationMeta}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          paginationMode={serverPagination ? "server" : "client"}
          disableRowSelectionOnClick
          disableColumnMenu
          pageSizeOptions={[10, 20, 50]}
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: "#EEF6FA",
              borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 800,
              color: "#2B425A",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
            },
            "& .MuiDataGrid-row:hover": {
              bgcolor: "rgba(27, 94, 167, 0.04)",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid rgba(15, 23, 42, 0.08)",
            },
            "& .MuiDataGrid-virtualScroller": {
              bgcolor: "#fff",
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Box
                sx={{
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  color: "text.secondary",
                }}
              >
                <Stack spacing={0.75} alignItems="center">
                  <Icon icon="mdi:inbox-outline" width={30} height={30} />
                  <Typography fontWeight={700}>Sin resultados</Typography>
                </Stack>
              </Box>
            ),
          }}
        />
      </Box>
    </Paper>
  );
}

