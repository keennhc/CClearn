import type { ApiResponse, UploadResult } from '@home-owners-hub/shared-types';
import { api } from './api';
import { unwrap } from './unwrap';

export async function uploadFile(file: File, folder: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await api.post<ApiResponse<UploadResult>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap(response);
}
