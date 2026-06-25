import { useState } from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export function PasswordField(props: Omit<TextFieldProps, 'type'>) {
  const [show, setShow] = useState(false);
  const { InputProps, ...rest } = props;

  return (
    <TextField
      {...rest}
      type={show ? 'text' : 'password'}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <>
            {InputProps?.endAdornment}
            <InputAdornment position="end">
              <IconButton
                aria-label={show ? 'Hide password' : 'Show password'}
                onClick={() => setShow((v) => !v)}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
                size="small"
                disabled={props.disabled}
              >
                {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            </InputAdornment>
          </>
        ),
      }}
    />
  );
}
