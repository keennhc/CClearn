import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Chip, IconButton, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCommunity, regenerateCode } from '../api/communitiesApi';
import { LoadingState } from '../../../components/LoadingState';
import { CommunityMembersTab } from '../components/CommunityMembersTab';
import { CommunityChatPage } from '../../community/pages/CommunityChatPage';
import { AnnouncementsPage } from '../../announcements/pages/AnnouncementsPage';

const TAB_KEYS = ['members', 'chat', 'announcements'] as const;

export function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') ?? 'members';
  const tab = Math.max(0, TAB_KEYS.indexOf(tabParam as typeof TAB_KEYS[number]));

  const handleTabChange = (_: unknown, value: number) => {
    setSearchParams({ tab: TAB_KEYS[value] }, { replace: true });
  };

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', id],
    queryFn: () => getCommunity(id!),
    enabled: !!id,
  });

  const regenMutation = useMutation({
    mutationFn: () => regenerateCode(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community', id] }),
  });

  if (isLoading || !community) return <LoadingState />;

  return (
    <Box p={3} display="flex" flexDirection="column" sx={{ height: '100%', minHeight: 0 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <IconButton onClick={() => navigate('/communities')}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={600}>{community.name}</Typography>
          {community.description ? (
            <Typography color="text.secondary">{community.description}</Typography>
          ) : null}
        </Box>
        <Chip label={`Code: ${community.code}`} variant="outlined" />
        <Tooltip title="Copy join code">
          <IconButton size="small" onClick={() => navigator.clipboard.writeText(community.code)}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Regenerate join code">
          <IconButton size="small" onClick={() => regenMutation.mutate()} disabled={regenMutation.isPending}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Members" />
          <Tab label="Chat" />
          <Tab label="Announcements" />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {tab === 0 ? <CommunityMembersTab communityId={id!} /> : null}
        {tab === 1 ? <CommunityChatPage communityId={id!} /> : null}
        {tab === 2 ? <AnnouncementsPage communityId={id!} /> : null}
      </Box>
    </Box>
  );
}
