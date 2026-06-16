import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateUserDto } from '@home-owners-hub/shared-types';
import { updateUser } from '../api/usersApi';

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) => updateUser(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
