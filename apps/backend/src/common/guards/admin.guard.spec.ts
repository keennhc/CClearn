import { ExecutionContext } from '@nestjs/common';
import { CommunityMemberRole, UserRole } from '@home-owners-hub/shared-types';
import { AdminGuard } from './admin.guard';
import { CommunitiesService } from '../../modules/communities/communities.service';

function makeContext(user: { id: string; role: UserRole } | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  let communitiesService: { getUserCommunityMemberships: jest.Mock };
  let guard: AdminGuard;

  beforeEach(() => {
    communitiesService = { getUserCommunityMemberships: jest.fn() };
    guard = new AdminGuard(communitiesService as unknown as CommunitiesService);
  });

  it('allows SUPER_ADMIN', async () => {
    const context = makeContext({ id: 'user-1', role: UserRole.SUPER_ADMIN });

    expect(await guard.canActivate(context)).toBe(true);
    expect(communitiesService.getUserCommunityMemberships).not.toHaveBeenCalled();
  });

  it('allows a COMMUNITY_ADMIN of at least one community', async () => {
    communitiesService.getUserCommunityMemberships.mockResolvedValue([
      { communityId: 'c-1', communityName: 'Test', role: CommunityMemberRole.COMMUNITY_ADMIN },
    ]);
    const context = makeContext({ id: 'user-1', role: UserRole.USER });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('denies a USER with no admin memberships', async () => {
    communitiesService.getUserCommunityMemberships.mockResolvedValue([
      { communityId: 'c-1', communityName: 'Test', role: CommunityMemberRole.COMMUNITY_MEMBER },
    ]);
    const context = makeContext({ id: 'user-1', role: UserRole.USER });

    expect(await guard.canActivate(context)).toBe(false);
  });

  it('denies when there is no user on the request', async () => {
    const context = makeContext(undefined);

    expect(await guard.canActivate(context)).toBe(false);
  });
});
