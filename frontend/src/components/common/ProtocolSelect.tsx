import { MenuItem, TextField, type TextFieldProps } from '@mui/material';
import { PROTOCOL_OPTIONS, type ProtocolOption } from '@aerobrry/shared';

type Props = Omit<TextFieldProps, 'select' | 'value' | 'onChange'> & {
  value: ProtocolOption;
  onChange: (value: ProtocolOption) => void;
};

export function ProtocolSelect({ value, onChange, label = 'Protocol', ...rest }: Props) {
  return (
    <TextField
      select
      size="small"
      fullWidth
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as ProtocolOption)}
      {...rest}
    >
      {PROTOCOL_OPTIONS.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
