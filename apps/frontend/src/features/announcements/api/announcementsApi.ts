import type {
  Announcement,
  ApiResponse,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from '@home-owners-hub/shared-types';
import { api } from '../../../services/api';
import { unwrap } from '../../../services/unwrap';

export async function getAnnouncements(communityId: string): Promise<Announcement[]> {
  const response = await api.get<ApiResponse<Announcement[]>>(
    `/communities/${communityId}/announcements`,
  );
  return unwrap(response);
}

export async function createAnnouncement(communityId: string, dto: CreateAnnouncementDto): Promise<Announcement> {
  const response = await api.post<ApiResponse<Announcement>>(
    `/communities/${communityId}/announcements`,
    dto,
  );
  return unwrap(response);
}

export async function updateAnnouncement(
  communityId: string,
  id: string,
  dto: UpdateAnnouncementDto,
): Promise<Announcement> {
  const response = await api.patch<ApiResponse<Announcement>>(
    `/communities/${communityId}/announcements/${id}`,
    dto,
  );
  return unwrap(response);
}

export async function deleteAnnouncement(communityId: string, id: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/communities/${communityId}/announcements/${id}`);
}
