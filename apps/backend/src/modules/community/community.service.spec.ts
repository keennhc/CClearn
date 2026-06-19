import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '@home-owners-hub/shared-types';
import { CommunityMessage } from './entities/community-message.entity';
import { CommunityService } from './community.service';
import { CommunityGateway } from './community.gateway';
import { User } from '../users/entities/user.entity';

const COMMUNITY_ID = 'community-1';

function makeUser(): User {
  return {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hash',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    isActive: true,
    profileImageUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    messages: [],
    announcements: [],
  } as User;
}

function makeMessage(overrides: Partial<CommunityMessage> = {}): CommunityMessage {
  return {
    id: 'msg-1',
    message: 'Hello world',
    communityId: COMMUNITY_ID,
    userId: 'user-1',
    attachmentUrl: null,
    attachmentType: null,
    attachmentName: null,
    createdAt: new Date('2024-01-01'),
    user: makeUser(),
    ...overrides,
  } as CommunityMessage;
}

describe('CommunityService', () => {
  let service: CommunityService;
  let gateway: { broadcastMessage: jest.Mock };
  let repo: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    gateway = { broadcastMessage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        { provide: getRepositoryToken(CommunityMessage), useValue: repo },
        { provide: CommunityGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get(CommunityService);
  });

  describe('findAll', () => {
    it('returns paginated messages with userName', async () => {
      const msg = makeMessage();
      repo.findAndCount.mockResolvedValue([[msg], 1]);

      const result = await service.findAll(COMMUNITY_ID, { page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.items[0].userName).toBe('Test User');
    });

    it('filters by communityId', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(COMMUNITY_ID, {});

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { communityId: COMMUNITY_ID } }),
      );
    });
  });

  describe('create', () => {
    it('creates and returns the message with userName', async () => {
      const msg = makeMessage();
      repo.create.mockReturnValue(msg);
      repo.save.mockResolvedValue(msg);
      repo.findOne.mockResolvedValue(msg);

      const result = await service.create(COMMUNITY_ID, 'user-1', { message: 'Hello world' });

      expect(result.message).toBe('Hello world');
      expect(result.userName).toBe('Test User');
      expect(result.communityId).toBe(COMMUNITY_ID);
    });

    it('broadcasts the message to the community room', async () => {
      const msg = makeMessage();
      repo.create.mockReturnValue(msg);
      repo.save.mockResolvedValue(msg);
      repo.findOne.mockResolvedValue(msg);

      await service.create(COMMUNITY_ID, 'user-1', { message: 'Hello' });

      expect(gateway.broadcastMessage).toHaveBeenCalledWith(COMMUNITY_ID, expect.any(Object));
    });

    it('throws NotFoundException when saved message cannot be re-fetched', async () => {
      const msg = makeMessage();
      repo.create.mockReturnValue(msg);
      repo.save.mockResolvedValue(msg);
      repo.findOne.mockResolvedValue(null);

      await expect(service.create(COMMUNITY_ID, 'user-1', { message: 'Hi' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('count', () => {
    it('returns the total count', async () => {
      repo.count.mockResolvedValue(10);

      expect(await service.count()).toBe(10);
    });
  });
});
