import { Box, CircularProgress } from '@mui/material';

export function LoadingState() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" py={6}>
      <CircularProgress />
    </Box>
  );
}
