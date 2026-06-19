import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Community, CreateCommunityDto } from '@home-owners-hub/shared-types';
import { getCommunities, createCommunity, deleteCommunity } from '../api/communitiesApi';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { CreateCommunityDialog } from '../components/CreateCommunityDialog';

export function CommunitiesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Community | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['communities', search],
    queryFn: () => getCommunities({ search: search || undefined, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateCommunityDto) => createCommunity(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      setFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCommunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      setDeleting(null);
    },
  });

  const columns: GridColDef<Community>[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
    { field: 'code', headerName: 'Join Code', width: 120 },
    { field: 'memberCount', headerName: 'Members', width: 100, type: 'number' },
    { field: 'messageCount', headerName: 'Messages', width: 100, type: 'number' },
    { field: 'announcementCount', headerName: 'Announcements', width: 130, type: 'number' },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setDeleting(params.row);
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={600}>Communities</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          New Community
        </Button>
      </Stack>

      <TextField
        placeholder="Search communities..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 300 }}
      />

      <DataGrid
        rows={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        autoHeight
        disableRowSelectionOnClick
        onRowClick={(params) => navigate(`/communities/${params.id}`)}
        sx={{ cursor: 'pointer' }}
      />

      <CreateCommunityDialog
        open={formOpen}
        loading={createMutation.isPending}
        error={createMutation.error instanceof Error ? createMutation.error.message : null}
        onSubmit={(dto) => createMutation.mutate(dto)}
        onClose={() => { setFormOpen(false); createMutation.reset(); }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Deactivate community"
        description={`Are you sure you want to deactivate "${deleting?.name}"? It can be reactivated later.`}
        confirmLabel="Deactivate"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </Box>
  );
}
