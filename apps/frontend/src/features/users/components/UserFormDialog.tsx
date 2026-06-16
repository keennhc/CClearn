import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import type { CreateUserDto, UpdateUserDto, User } from '@home-owners-hub/shared-types';
import { UserRole } from '@home-owners-hub/shared-types';

interface UserFormDialogProps {
  open: boolean;
  user: User | null;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: CreateUserDto | UpdateUserDto) => void;
  onClose: () => void;
}

const emptyForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: UserRole.USER,
  isActive: true,
};

export function UserFormDialog({ open, user, loading, error, onSubmit, onClose }: UserFormDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = user !== null;

  useEffect(() => {
    if (open) {
      setForm(
        user
          ? {
              email: user.email,
              password: '',
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              isActive: user.isActive,
            }
          : emptyForm,
      );
    }
  }, [open, user]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isEdit) {
      const dto: UpdateUserDto = {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        isActive: form.isActive,
      };
      onSubmit(dto);
    } else {
      const dto: CreateUserDto = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
      };
      onSubmit(dto);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit User' : 'New User'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} component="form" onSubmit={handleSubmit} id="user-form" pt={1}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            autoFocus
          />
          {!isEdit ? (
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              helperText="Minimum 8 characters"
            />
          ) : null}
          <Stack direction="row" spacing={2}>
            <TextField
              label="First Name"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              required
              fullWidth
            />
          </Stack>
          <FormControl fullWidth>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              label="Role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            >
              <MenuItem value={UserRole.USER}>User</MenuItem>
              <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
            </Select>
          </FormControl>
          {isEdit ? (
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              }
              label="Active"
            />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form="user-form" variant="contained" disabled={loading}>
          {isEdit ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
