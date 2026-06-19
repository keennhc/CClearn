export enum AttachmentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  GIF = 'GIF',
  FILE = 'FILE',
}

export enum CommunityMemberRole {
  COMMUNITY_ADMIN = 'COMMUNITY_ADMIN',
  COMMUNITY_MEMBER = 'COMMUNITY_MEMBER',
}

export interface Community {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  memberCount: number;
  messageCount: number;
  announcementCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  userId: string;
  communityId: string;
  role: CommunityMemberRole;
  userName: string;
  userEmail: string;
  joinedAt: string;
}

export interface CommunityMessage {
  id: string;
  message: string | null;
  communityId: string;
  userId: string;
  userName: string;
  userRole: string;
  attachmentUrl: string | null;
  attachmentType: AttachmentType | null;
  attachmentName: string | null;
  createdAt: string;
}

export interface CreateCommunityDto {
  name: string;
  description?: string;
}

export interface UpdateCommunityDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AddCommunityMemberDto {
  email: string;
  role: CommunityMemberRole;
}

export interface UpdateCommunityMemberRoleDto {
  role: CommunityMemberRole;
}

export interface CreateMessageDto {
  message?: string;
  attachmentUrl?: string;
  attachmentType?: AttachmentType;
  attachmentName?: string;
}
