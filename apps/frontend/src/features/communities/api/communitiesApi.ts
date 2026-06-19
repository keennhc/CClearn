import type {
  ApiResponse,
  Community,
  CommunityMember,
  CommunityStats,
  PaginatedResult,
  AddCommunityMemberDto,
  UpdateCommunityMemberRoleDto,
  CreateCommunityDto,
  UpdateCommunityDto,
} from '@home-owners-hub/shared-types';
import { api } from '../../../services/api';
import { unwrap } from '../../../services/unwrap';

export async function getCommunities(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResult<Community>> {
  const response = await api.get<ApiResponse<PaginatedResult<Community>>>('/communities', { params });
  return unwrap(response);
}

export async function getCommunity(id: string): Promise<Community> {
  const response = await api.get<ApiResponse<Community>>(`/communities/${id}`);
  return unwrap(response);
}

export async function createCommunity(dto: CreateCommunityDto): Promise<Community> {
  const response = await api.post<ApiResponse<Community>>('/communities', dto);
  return unwrap(response);
}

export async function updateCommunity(id: string, dto: UpdateCommunityDto): Promise<Community> {
  const response = await api.patch<ApiResponse<Community>>(`/communities/${id}`, dto);
  return unwrap(response);
}

export async function deleteCommunity(id: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/communities/${id}`);
}

export async function regenerateCode(id: string): Promise<{ code: string }> {
  const response = await api.post<ApiResponse<{ code: string }>>(`/communities/${id}/regenerate-code`);
  return unwrap(response);
}

export async function getCommunityStats(id: string): Promise<CommunityStats> {
  const response = await api.get<ApiResponse<CommunityStats>>(`/communities/${id}/stats`);
  return unwrap(response);
}

export async function getMembers(
  communityId: string,
  params?: { page?: number; limit?: number; search?: string },
): Promise<PaginatedResult<CommunityMember>> {
  const response = await api.get<ApiResponse<PaginatedResult<CommunityMember>>>(
    `/communities/${communityId}/members`,
    { params },
  );
  return unwrap(response);
}

export interface NonMemberUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function searchNonMembers(communityId: string, search: string): Promise<NonMemberUser[]> {
  const response = await api.get<ApiResponse<NonMemberUser[]>>(
    `/communities/${communityId}/non-members`,
    { params: { search } },
  );
  return unwrap(response);
}

export async function addMember(communityId: string, dto: AddCommunityMemberDto): Promise<CommunityMember> {
  const response = await api.post<ApiResponse<CommunityMember>>(
    `/communities/${communityId}/members`,
    dto,
  );
  return unwrap(response);
}

export async function updateMemberRole(
  communityId: string,
  memberId: string,
  dto: UpdateCommunityMemberRoleDto,
): Promise<CommunityMember> {
  const response = await api.patch<ApiResponse<CommunityMember>>(
    `/communities/${communityId}/members/${memberId}`,
    dto,
  );
  return unwrap(response);
}

export async function removeMember(communityId: string, memberId: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/communities/${communityId}/members/${memberId}`);
}
