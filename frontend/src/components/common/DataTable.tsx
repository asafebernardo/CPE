import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { acsColors } from '../../theme/colors';

interface Column {
  key: string;
  label: string;
}

interface DataTableProps {
  columns: Column[];
  rows: Array<Record<string, unknown>>;
}

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        borderRadius: 2,
        border: `1px solid ${acsColors.border}`,
        bgcolor: acsColors.bgCard,
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ fontWeight: 600, color: acsColors.textSecondary, bgcolor: acsColors.bgSecondary }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
              {columns.map((col) => (
                <TableCell key={col.key} sx={{ color: acsColors.textPrimary, fontSize: '0.875rem' }}>
                  {row[col.key] as React.ReactNode}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
