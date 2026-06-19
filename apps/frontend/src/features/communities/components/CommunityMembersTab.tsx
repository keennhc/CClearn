import { useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CommunityMember } from '@home-owners-hub/shared-types';
import { CommunityMemberRole } from '@home-owners-hub/shared-types';
import {
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
  searchNonMembers,
  type NonMemberUser,
} from '../api/communitiesApi';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

export function CommunityMembersTab({ communityId }: { communityId: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<NonMemberUser | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [role, setRole] = useState<CommunityMemberRole>(CommunityMemberRole.COMMUNITY_MEMBER);
  const [removing, setRemoving] = useState<CommunityMember | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['community-members', communityId, search],
    queryFn: () => getMembers(communityId, { search: search || undefined, limit: 100 }),
    enabled: !!communityId,
  });

  const { data: nonMembers, isLoading: nonMembersLoading } = useQuery({
    queryKey: ['non-members', communityId, userSearch],
    queryFn: () => searchNonMembers(communityId, userSearch),
    enabled: addOpen && userSearch.length >= 1,
  });

  const addMutation = useMutation({
    mutationFn: () => addMember(communityId, { email: selectedUser!.email, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['non-members', communityId] });
      handleCloseAdd();
    },
    onError: (err: Error) => setAddError(err.message),
  });

  const roleToggleMutation = useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: string; newRole: CommunityMemberRole }) =>
      updateMemberRole(communityId, memberId, { role: newRole }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-members', communityId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(communityId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      setRemoving(null);
    },
  });

  const handleCloseAdd = () => {
    setAddOpen(false);
    setSelectedUser(null);
    setUserSearch('');
    setRole(CommunityMemberRole.COMMUNITY_MEMBER);
    setAddError(null);
  };

  const toggleRole = (member: CommunityMember) => {
    const newRole = member.role === CommunityMemberRole.COMMUNITY_ADMIN
      ? CommunityMemberRole.COMMUNITY_MEMBER
      : CommunityMemberRole.COMMUNITY_ADMIN;
    roleToggleMutation.mutate({ memberId: member.id, newRole });
  };

  const columns: GridColDef<CommunityMember>[] = [
    { field: 'userName', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'userEmail', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'role',
      headerName: 'Role',
      width: 160,
      valueFormatter: (value: string) =>
        value === CommunityMemberRole.COMMUNITY_ADMIN ? 'Admin' : 'Member',
    },
    {
      field: 'joinedAt',
      headerName: 'Joined',
      width: 130,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions',
      type: 'actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="role"
          icon={<SwapVertIcon />}
          label="Toggle role"
          onClick={() => toggleRole(params.row)}
        />,
        <GridActionsCellItem
          key="remove"
          icon={<DeleteIcon />}
          label="Remove"
          onClick={() => setRemoving(params.row)}
        />,
      ],
    },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <TextField
          placeholder="Search members..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 300 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Add Member
        </Button>
      </Stack>

      <DataGrid
        rows={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        autoHeight
        disableRowSelectionOnClick
      />

      <Dialog open={addOpen} onClose={handleCloseAdd} fullWidth maxWidth="sm">
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            {addError ? <Typography color="error">{addError}</Typography> : null}
            <Autocomplete
              options={nonMembers ?? []}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedUser}
              onChange={(_, value) => setSelectedUser(value)}
              inputValue={userSearch}
              onInputChange={(_, value) => setUserSearch(value)}
              loading={nonMembersLoading}
              noOptionsText={userSearch.length < 1 ? 'Type to search users' : 'No users found'}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">
                      {option.firstName} {option.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search users"
                  autoFocus
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {nonMembersLoading ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as CommunityMemberRole)}
              >
                <MenuItem value={CommunityMemberRole.COMMUNITY_MEMBER}>Member</MenuItem>
                <MenuItem value={CommunityMemberRole.COMMUNITY_ADMIN}>Admin</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd}>Cancel</Button>
          <Button
            variant="contained"
            disabled={addMutation.isPending || !selectedUser}
            onClick={() => addMutation.mutate()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        title="Remove member"
        description={`Remove ${removing?.userName} from this community?`}
        confirmLabel="Remove"
        loading={removeMutation.isPending}
        onConfirm={() => removing && removeMutation.mutate(removing.id)}
        onCancel={() => setRemoving(null)}
      />
    </Box>
  );
}
