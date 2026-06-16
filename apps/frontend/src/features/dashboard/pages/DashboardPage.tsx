import { Navigate } from 'react-router-dom';
import { Box, Grid, Typography } from '@mui/material';
import { StatCard } from '../../../components/StatCard';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { useAuth } from '../../auth/context/AuthContext';
import { useDashboardStats } from '../hooks/useDashboardStats';

export function DashboardPage() {
  const { isAdmin } = useAuth();
  const { data, isLoading, isError } = useDashboardStats();

  if (!isAdmin) {
    return <Navigate to="/community" replace />;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={600} mb={3}>
        Dashboard
      </Typography>

      {isLoading ? <LoadingState /> : null}
      {isError ? <EmptyState message="Unable to load dashboard stats." /> : null}

      {data ? (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <StatCard title="Total Users" value={data.totalUsers} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard title="Community Messages" value={data.totalMessages} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard title="Announcements" value={data.totalAnnouncements} />
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
}
