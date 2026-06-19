import { useState, type FormEvent } from 'react';
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
import type { CreateCommunityDto } from '@home-owners-hub/shared-types';

interface Props {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  onSubmit: (dto: CreateCommunityDto) => void;
  onClose: () => void;
}

export function CreateCommunityDialog({ open, loading, error, onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ name, description: description || undefined });
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>New Community</DialogTitle>
      <DialogContent>
        <Stack spacing={2} component="form" id="community-form" onSubmit={handleSubmit} pt={1}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button type="submit" form="community-form" variant="contained" disabled={loading || !name.trim()}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
