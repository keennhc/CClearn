import { useMemo, useState } from 'react';
import { Avatar, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import type { CreateUserDto, UpdateUserDto, User } from '@home-owners-hub/shared-types';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useUsers } from '../hooks/useUsers';
import { useCreateUser } from '../hooks/useCreateUser';
import { useUpdateUser } from '../hooks/useUpdateUser';
import { useDeleteUser } from '../hooks/useDeleteUser';
import { UserFormDialog } from '../components/UserFormDialog';

export function UsersPage() {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const { data, isLoading, isFetching } = useUsers({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    search: search || undefined,
  });

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    createMutation.reset();
    updateMutation.reset();
  };

  const handleSubmit = (values: CreateUserDto | UpdateUserDto) => {
    if (editingUser) {
      updateMutation.mutate(
        { id: editingUser.id, dto: values as UpdateUserDto },
        { onSuccess: handleCloseForm },
      );
    } else {
      createMutation.mutate(values as CreateUserDto, { onSuccess: handleCloseForm });
    }
  };

  const handleToggleActive = (user: User) => {
    updateMutation.mutate({ id: user.id, dto: { isActive: !user.isActive } });
  };

  const handleConfirmDelete = () => {
    if (deletingUser) {
      deleteMutation.mutate(deletingUser.id, { onSuccess: () => setDeletingUser(null) });
    }
  };

  const columns: GridColDef<User>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        minWidth: 200,
        valueGetter: (_value, row) => `${row.firstName} ${row.lastName}`,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={1} height="100%">
            <Avatar
              src={params.row.profileImageUrl ?? undefined}
              sx={{ width: 32, height: 32, fontSize: 14 }}
            >
              {params.row.firstName[0]}
            </Avatar>
            <span>{params.value}</span>
          </Stack>
        ),
      },
      { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 200 },
      {
        field: 'role',
        headerName: 'Role',
        width: 150,
        renderCell: (params) => {
          const label = params.value === 'SUPER_ADMIN' ? 'Super Admin' : params.value === 'ADMIN' ? 'Admin' : 'User';
          const color = params.value === 'SUPER_ADMIN' ? 'secondary' : params.value === 'ADMIN' ? 'primary' : 'default';
          return <Chip label={label} size="small" color={color} />;
        },
      },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value ? 'Active' : 'Inactive'}
            size="small"
            color={params.value ? 'success' : 'default'}
          />
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Created Date',
        width: 160,
        valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 140,
        getActions: (params) => {
          if (params.row.role === 'SUPER_ADMIN') {
            return [];
          }
          return [
            <GridActionsCellItem
              key="edit"
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleOpenEdit(params.row)}
            />,
            <GridActionsCellItem
              key="toggle"
              icon={params.row.isActive ? <ToggleOnIcon /> : <ToggleOffIcon />}
              label={params.row.isActive ? 'Deactivate' : 'Activate'}
              onClick={() => handleToggleActive(params.row)}
            />,
            <GridActionsCellItem
              key="delete"
              icon={<DeleteIcon />}
              label="Delete"
              onClick={() => setDeletingUser(params.row)}
            />,
          ];
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={600}>
          Users
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          New User
        </Button>
      </Stack>

      <TextField
        label="Search"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPaginationModel((m) => ({ ...m, page: 0 }));
        }}
        size="small"
        sx={{ mb: 2, width: 320 }}
      />

      <DataGrid
        rows={data?.items ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        rowCount={data?.total ?? 0}
        loading={isLoading || isFetching}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
        autoHeight
      />

      <UserFormDialog
        open={formOpen}
        user={editingUser}
        loading={createMutation.isPending || updateMutation.isPending}
        error={
          createMutation.error instanceof Error
            ? createMutation.error.message
            : updateMutation.error instanceof Error
              ? updateMutation.error.message
              : null
        }
        onSubmit={handleSubmit}
        onClose={handleCloseForm}
      />

      <ConfirmDialog
        open={deletingUser !== null}
        title="Delete user"
        description={`Are you sure you want to delete ${deletingUser?.email}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </Box>
  );
}
