import type {
  ApiResponse,
  CommunityMessage,
  CreateMessageDto,
  PaginatedResult,
} from '@home-owners-hub/shared-types';
import { api } from '../../../services/api';
import { unwrap } from '../../../services/unwrap';

export async function getMessages(
  page: number,
  limit: number,
): Promise<PaginatedResult<CommunityMessage>> {
  const response = await api.get<ApiResponse<PaginatedResult<CommunityMessage>>>(
    '/community/messages',
    { params: { page, limit } },
  );
  return unwrap(response);
}

export async function postMessage(dto: CreateMessageDto): Promise<CommunityMessage> {
  const response = await api.post<ApiResponse<CommunityMessage>>('/community/messages', dto);
  return unwrap(response);
}
