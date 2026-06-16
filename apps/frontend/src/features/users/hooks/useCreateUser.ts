import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateUserDto } from '@home-owners-hub/shared-types';
import { createUser } from '../api/usersApi';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateUserDto) => createUser(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
