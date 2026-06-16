import type {
  ApiResponse,
  CreateUserDto,
  PaginatedResult,
  UpdateUserDto,
  User,
} from '@home-owners-hub/shared-types';
import { api } from '../../../services/api';
import { unwrap } from '../../../services/unwrap';

export interface UsersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getUsers(query: UsersQuery): Promise<PaginatedResult<User>> {
  const response = await api.get<ApiResponse<PaginatedResult<User>>>('/users', {
    params: query,
  });
  return unwrap(response);
}

export async function createUser(dto: CreateUserDto): Promise<User> {
  const response = await api.post<ApiResponse<User>>('/users', dto);
  return unwrap(response);
}

export async function updateUser(id: string, dto: UpdateUserDto): Promise<User> {
  const response = await api.patch<ApiResponse<User>>(`/users/${id}`, dto);
  return unwrap(response);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/users/${id}`);
}
