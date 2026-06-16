import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
    secondary: {
      main: '#0f172a',
    },
    background: {
      default: '#f1f5f9',
    },
  },
  shape: {
    borderRadius: 8,
  },
});
