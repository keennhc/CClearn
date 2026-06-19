import { useState } from 'react';
import { Box, Button, Card, CardContent, IconButton, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type {
  Announcement,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from '@home-owners-hub/shared-types';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { useCreateAnnouncement } from '../hooks/useCreateAnnouncement';
import { useUpdateAnnouncement } from '../hooks/useUpdateAnnouncement';
import { useDeleteAnnouncement } from '../hooks/useDeleteAnnouncement';
import { AnnouncementFormDialog } from '../components/AnnouncementFormDialog';

export function AnnouncementsPage({ communityId }: { communityId: string }) {
  const { data, isLoading, isError } = useAnnouncements(communityId);
  const createMutation = useCreateAnnouncement(communityId);
  const updateMutation = useUpdateAnnouncement(communityId);
  const deleteMutation = useDeleteAnnouncement(communityId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  const handleOpenCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setEditing(announcement);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    createMutation.reset();
    updateMutation.reset();
  };

  const handleSubmit = (values: CreateAnnouncementDto | UpdateAnnouncementDto) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, dto: values }, { onSuccess: handleClose });
    } else {
      createMutation.mutate(values as CreateAnnouncementDto, { onSuccess: handleClose });
    }
  };

  const handleConfirmDelete = () => {
    if (deleting) {
      deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
    }
  };

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={600}>
          Announcements
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          New Announcement
        </Button>
      </Stack>

      {isLoading ? <LoadingState /> : null}
      {isError ? <EmptyState message="Unable to load announcements." /> : null}
      {!isLoading && data?.length === 0 ? (
        <EmptyState message="No announcements yet." />
      ) : null}

      <Stack spacing={2}>
        {data?.map((announcement) => (
          <Card key={announcement.id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6">{announcement.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(announcement.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Stack direction="row">
                  <IconButton size="small" onClick={() => handleOpenEdit(announcement)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setDeleting(announcement)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
              <Typography variant="body1" whiteSpace="pre-wrap" mt={1}>
                {announcement.content}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <AnnouncementFormDialog
        open={formOpen}
        announcement={editing}
        loading={createMutation.isPending || updateMutation.isPending}
        error={
          createMutation.error instanceof Error
            ? createMutation.error.message
            : updateMutation.error instanceof Error
              ? updateMutation.error.message
              : null
        }
        onSubmit={handleSubmit}
        onClose={handleClose}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete announcement"
        description={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </Box>
  );
}
