import type {
  Announcement,
  ApiResponse,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from '@home-owners-hub/shared-types';
import { api } from '../../../services/api';
import { unwrap } from '../../../services/unwrap';

export async function getAnnouncements(): Promise<Announcement[]> {
  const response = await api.get<ApiResponse<Announcement[]>>('/announcements');
  return unwrap(response);
}

export async function createAnnouncement(dto: CreateAnnouncementDto): Promise<Announcement> {
  const response = await api.post<ApiResponse<Announcement>>('/announcements', dto);
  return unwrap(response);
}

export async function updateAnnouncement(
  id: string,
  dto: UpdateAnnouncementDto,
): Promise<Announcement> {
  const response = await api.patch<ApiResponse<Announcement>>(`/announcements/${id}`, dto);
  return unwrap(response);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/announcements/${id}`);
}
