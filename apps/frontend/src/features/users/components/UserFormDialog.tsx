import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import type { CreateUserDto, UpdateUserDto, User } from '@home-owners-hub/shared-types';
import { UserRole } from '@home-owners-hub/shared-types';
import { uploadFile } from '../../../services/uploadApi';

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
  profileImageUrl: null as string | null,
};

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

export function UserFormDialog({ open, user, loading, error, onSubmit, onClose }: UserFormDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = user !== null;

  useEffect(() => {
    if (open) {
      setUploadError(null);
      setForm(
        user
          ? {
              email: user.email,
              password: '',
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              isActive: user.isActive,
              profileImageUrl: user.profileImageUrl,
            }
          : emptyForm,
      );
    }
  }, [open, user]);

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setUploadError('Image must be under 5MB');
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadFile(file, 'profile-images');
      setForm((f) => ({ ...f, profileImageUrl: result.url }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isEdit) {
      const dto: UpdateUserDto = {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        isActive: form.isActive,
        profileImageUrl: form.profileImageUrl,
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
          {error || uploadError ? (
            <Alert severity="error">{error || uploadError}</Alert>
          ) : null}

          {isEdit ? (
            <Box display="flex" justifyContent="center" mb={1}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    size="small"
                    sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, width: 32, height: 32 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <PhotoCameraIcon fontSize="small" />
                  </IconButton>
                }
              >
                <Avatar
                  src={form.profileImageUrl ?? undefined}
                  sx={{ width: 80, height: 80, fontSize: 32 }}
                >
                  {form.firstName?.[0] ?? ''}
                </Avatar>
              </Badge>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageSelect}
              />
            </Box>
          ) : null}

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
              <MenuItem value={UserRole.SUPER_ADMIN}>Super Admin</MenuItem>
            </Select>
          </FormControl>
          {isEdit && form.role !== UserRole.SUPER_ADMIN ? (
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
        <Button onClick={onClose} disabled={loading || uploading}>
          Cancel
        </Button>
        <Button type="submit" form="user-form" variant="contained" disabled={loading || uploading}>
          {isEdit ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
