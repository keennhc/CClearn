import type {
  ApiResponse,
  CommunityMessage,
  CreateMessageDto,
  PaginatedResult,
} from '@home-owners-hub/shared-types';
import { api } from '../../../services/api';
import { unwrap } from '../../../services/unwrap';

export async function getMessages(
  communityId: string,
  page: number,
  limit: number,
): Promise<PaginatedResult<CommunityMessage>> {
  const response = await api.get<ApiResponse<PaginatedResult<CommunityMessage>>>(
    `/communities/${communityId}/messages`,
    { params: { page, limit } },
  );
  return unwrap(response);
}

export async function postMessage(communityId: string, dto: CreateMessageDto): Promise<CommunityMessage> {
  const response = await api.post<ApiResponse<CommunityMessage>>(
    `/communities/${communityId}/messages`,
    dto,
  );
  return unwrap(response);
}
