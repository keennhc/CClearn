import { CommunityMemberRole } from './community';
import { UserRole } from './user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  communityCode?: string;
  createCommunity?: {
    name: string;
    description?: string;
  };
}

export interface AuthCommunity {
  id: string;
  name: string;
  role: CommunityMemberRole;
}

export interface AuthProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImageUrl: string | null;
  communities: AuthCommunity[];
}
