import type { ApiResponse, LoginRequest, LoginResponse } from '@home-owners-hub/shared-types';
import { api } from '../../../services/api';
import { unwrap } from '../../../services/unwrap';

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
  return unwrap(response);
}
