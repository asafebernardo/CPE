import { Grid, Typography } from '@mui/material';

export interface InfoField {
  label: string;
  value: string | number;
  mono?: boolean;
}

export function ReadOnlyInfoGrid({ fields, columns = 4 }: { fields: InfoField[]; columns?: number }) {
  const md = 12 / columns;
  return (
    <Grid container spacing={2}>
      {fields.map((f) => (
        <Grid item xs={12} sm={6} md={md} key={f.label}>
          <Typography variant="caption" color="text.secondary">{f.label}</Typography>
          <Typography
            variant="body1"
            fontWeight={600}
            sx={{ fontFamily: f.mono ? 'monospace' : undefined, fontSize: f.mono ? '0.875rem' : undefined }}
          >
            {f.value}
          </Typography>
        </Grid>
      ))}
    </Grid>
  );
}
