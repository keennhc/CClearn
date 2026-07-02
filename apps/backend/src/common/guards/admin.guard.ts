import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CommunityMemberRole, UserRole } from '@home-owners-hub/shared-types';
import { CommunitiesService } from '../../modules/communities/communities.service';

// Allows SUPER_ADMIN, or a COMMUNITY_ADMIN of at least one community -- for
// routes with no single :communityId to check against (unlike CommunityAdminGuard).
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly communitiesService: CommunitiesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = context.switchToHttp().getRequest().user;
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN) return true;

    const memberships = await this.communitiesService.getUserCommunityMemberships(user.id);
    return memberships.some((m) => m.role === CommunityMemberRole.COMMUNITY_ADMIN);
  }
}
