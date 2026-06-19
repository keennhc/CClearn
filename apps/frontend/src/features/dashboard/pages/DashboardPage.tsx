import { Box, Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '../../../components/StatCard';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { useAuth } from '../../auth/context/AuthContext';
import { getDashboardStats } from '../api/dashboardApi';
import { getCommunityStats } from '../../communities/api/communitiesApi';

export function DashboardPage() {
  const { isSuperAdmin, activeCommunityId } = useAuth();

  const globalQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    enabled: isSuperAdmin,
  });

  const communityQuery = useQuery({
    queryKey: ['community-stats', activeCommunityId],
    queryFn: () => getCommunityStats(activeCommunityId!),
    enabled: !isSuperAdmin && !!activeCommunityId,
  });

  const isLoading = isSuperAdmin ? globalQuery.isLoading : communityQuery.isLoading;
  const isError = isSuperAdmin ? globalQuery.isError : communityQuery.isError;

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={600} mb={3}>
        Dashboard
      </Typography>

      {isLoading ? <LoadingState /> : null}
      {isError ? <EmptyState message="Unable to load dashboard stats." /> : null}

      {isSuperAdmin && globalQuery.data ? (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <StatCard title="Total Users" value={globalQuery.data.totalUsers} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard title="Total Messages" value={globalQuery.data.totalMessages} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard title="Total Announcements" value={globalQuery.data.totalAnnouncements} />
          </Grid>
        </Grid>
      ) : null}

      {!isSuperAdmin && communityQuery.data ? (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <StatCard title="Members" value={communityQuery.data.totalMembers} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard title="Messages" value={communityQuery.data.totalMessages} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard title="Announcements" value={communityQuery.data.totalAnnouncements} />
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
}
