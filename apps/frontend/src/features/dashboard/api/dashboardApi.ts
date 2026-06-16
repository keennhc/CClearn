import type { ApiResponse, DashboardStats } from '@home-owners-hub/shared-types';
import { api } from '../../../services/api';
import { unwrap } from '../../../services/unwrap';

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return unwrap(response);
}
