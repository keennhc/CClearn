import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '@home-owners-hub/shared-types';
import { CommunitiesService } from '../../modules/communities/communities.service';

@Injectable()
export class CommunityMemberGuard implements CanActivate {
  constructor(private readonly communitiesService: CommunitiesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    if (user.role === UserRole.SUPER_ADMIN) return true;

    const communityId = request.params.communityId ?? request.params.id;
    if (!communityId) return false;

    const membership = await this.communitiesService.getUserMembership(user.id, communityId);
    return membership !== null;
  }
}
