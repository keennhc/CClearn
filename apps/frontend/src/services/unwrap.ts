import type { AxiosResponse } from 'axios';
import type { ApiResponse } from '@home-owners-hub/shared-types';

export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const body = response.data;
  if (!body.success) {
    throw new Error(body.message);
  }
  return body.data;
}
