import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import type { Announcement, CreateAnnouncementDto, UpdateAnnouncementDto } from '@home-owners-hub/shared-types';

interface AnnouncementFormDialogProps {
  open: boolean;
  announcement: Announcement | null;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: CreateAnnouncementDto | UpdateAnnouncementDto) => void;
  onClose: () => void;
}

const emptyForm = { title: '', content: '' };

export function AnnouncementFormDialog({
  open,
  announcement,
  loading,
  error,
  onSubmit,
  onClose,
}: AnnouncementFormDialogProps) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(
        announcement
          ? { title: announcement.title, content: announcement.content }
          : emptyForm,
      );
    }
  }, [open, announcement]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{announcement ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} component="form" onSubmit={handleSubmit} id="announcement-form" pt={1}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            autoFocus
          />
          <TextField
            label="Content"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            required
            multiline
            minRows={4}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form="announcement-form" variant="contained" disabled={loading}>
          {announcement ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
