import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PushToken } from './entities/push-token.entity';
import { NotificationsService } from './notifications.service';
import { ExpoPushClient } from './expo-push.client';
import { CommunitiesService } from '../communities/communities.service';

const USER_ID = 'user-1';
const COMMUNITY_ID = 'community-1';

function makeToken(overrides: Partial<PushToken> = {}): PushToken {
  return {
    id: 'token-1',
    userId: USER_ID,
    token: 'ExponentPushToken[abc]',
    platform: 'ios',
    createdAt: new Date('2024-01-01'),
    user: {} as never,
    ...overrides,
  } as PushToken;
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let tokenRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock; delete: jest.Mock; find: jest.Mock };
  let communitiesService: { getCommunityMemberUserIds: jest.Mock };
  let expo: { isValidToken: jest.Mock; send: jest.Mock };

  beforeEach(async () => {
    tokenRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn(), find: jest.fn() };
    communitiesService = { getCommunityMemberUserIds: jest.fn() };
    expo = { isValidToken: jest.fn().mockReturnValue(true), send: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(PushToken), useValue: tokenRepo },
        { provide: CommunitiesService, useValue: communitiesService },
        { provide: ExpoPushClient, useValue: expo },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  describe('registerToken', () => {
    it('creates a new token when it does not already exist', async () => {
      tokenRepo.findOne.mockResolvedValue(null);
      const created = makeToken();
      tokenRepo.create.mockReturnValue(created);
      tokenRepo.save.mockResolvedValue(created);

      await service.registerToken(USER_ID, { token: created.token, platform: 'ios' });

      expect(tokenRepo.create).toHaveBeenCalledWith({ userId: USER_ID, token: created.token, platform: 'ios' });
      expect(tokenRepo.save).toHaveBeenCalledWith(created);
    });

    it('re-assigns an existing token to the current user (device re-login)', async () => {
      const existing = makeToken({ userId: 'someone-else' });
      tokenRepo.findOne.mockResolvedValue(existing);
      tokenRepo.save.mockResolvedValue(existing);

      await service.registerToken(USER_ID, { token: existing.token, platform: 'android' });

      expect(tokenRepo.create).not.toHaveBeenCalled();
      expect(tokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID, platform: 'android' }),
      );
    });
  });

  describe('unregisterToken', () => {
    it('deletes the token scoped to the user', async () => {
      await service.unregisterToken(USER_ID, 'ExponentPushToken[abc]');

      expect(tokenRepo.delete).toHaveBeenCalledWith({ userId: USER_ID, token: 'ExponentPushToken[abc]' });
    });
  });

  describe('notifyCommunity', () => {
    it('sends to all member tokens except the excluded user', async () => {
      communitiesService.getCommunityMemberUserIds.mockResolvedValue([USER_ID, 'user-2']);
      tokenRepo.find.mockResolvedValue([makeToken({ userId: 'user-2' })]);

      await service.notifyCommunity(COMMUNITY_ID, USER_ID, {
        title: 'Title',
        body: 'Body',
        data: { type: 'message', communityId: COMMUNITY_ID },
      });

      expect(tokenRepo.find).toHaveBeenCalledWith({ where: { userId: expect.anything() } });
      expect(expo.send).toHaveBeenCalledWith([
        expect.objectContaining({ to: 'ExponentPushToken[abc]', title: 'Title', body: 'Body' }),
      ]);
    });

    it('does nothing when the only member is the excluded user', async () => {
      communitiesService.getCommunityMemberUserIds.mockResolvedValue([USER_ID]);

      await service.notifyCommunity(COMMUNITY_ID, USER_ID, { title: 'T', body: 'B', data: {} });

      expect(tokenRepo.find).not.toHaveBeenCalled();
      expect(expo.send).not.toHaveBeenCalled();
    });

    it('filters out invalid tokens before sending', async () => {
      communitiesService.getCommunityMemberUserIds.mockResolvedValue(['user-2']);
      tokenRepo.find.mockResolvedValue([makeToken({ userId: 'user-2', token: 'not-a-real-token' })]);
      expo.isValidToken.mockReturnValue(false);

      await service.notifyCommunity(COMMUNITY_ID, USER_ID, { title: 'T', body: 'B', data: {} });

      expect(expo.send).toHaveBeenCalledWith([]);
    });

    it('swallows errors so a push failure never throws', async () => {
      communitiesService.getCommunityMemberUserIds.mockRejectedValue(new Error('db down'));

      await expect(
        service.notifyCommunity(COMMUNITY_ID, USER_ID, { title: 'T', body: 'B', data: {} }),
      ).resolves.toBeUndefined();
    });
  });
});
