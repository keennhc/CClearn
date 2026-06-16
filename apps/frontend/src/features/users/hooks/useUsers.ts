import { useQuery } from '@tanstack/react-query';
import { getUsers, type UsersQuery } from '../api/usersApi';

export function useUsers(query: UsersQuery) {
  return useQuery({
    queryKey: ['users', query],
    queryFn: () => getUsers(query),
    placeholderData: (previousData) => previousData,
  });
}
