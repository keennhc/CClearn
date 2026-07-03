import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementsService } from './announcements.service';
import { NotificationsService } from '../notifications/notifications.service';

const COMMUNITY_ID = 'community-1';

function makeAnnouncement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: 'ann-1',
    title: 'Test Title',
    content: 'Test content.',
    communityId: COMMUNITY_ID,
    createdBy: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    author: { firstName: 'Jane', lastName: 'Smith' } as never,
    community: {} as never,
    ...overrides,
  } as Announcement;
}

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let notificationsService: { notifyCommunity: jest.Mock };
  let repo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    count: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    };

    notificationsService = { notifyCommunity: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: getRepositoryToken(Announcement), useValue: repo },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(AnnouncementsService);
  });

  describe('findAll', () => {
    it('returns all announcements for a community ordered by createdAt DESC', async () => {
      const ann = makeAnnouncement();
      repo.find.mockResolvedValue([ann]);

      const result = await service.findAll(COMMUNITY_ID);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe(ann.title);
      expect(result[0].authorFirstName).toBe('Jane');
      expect(repo.find).toHaveBeenCalledWith({
        where: { communityId: COMMUNITY_ID },
        relations: { author: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('creates and returns the announcement', async () => {
      const ann = makeAnnouncement();
      repo.create.mockReturnValue(ann);
      repo.save.mockResolvedValue(ann);
      repo.findOne.mockResolvedValue(ann);

      const result = await service.create(COMMUNITY_ID, 'user-1', {
        title: ann.title,
        content: ann.content,
      });

      expect(result.title).toBe(ann.title);
      expect(result.communityId).toBe(COMMUNITY_ID);
      expect(result.authorFirstName).toBe('Jane');
    });

    it('notifies the community, excluding the author', async () => {
      const ann = makeAnnouncement();
      repo.create.mockReturnValue(ann);
      repo.save.mockResolvedValue(ann);
      repo.findOne.mockResolvedValue(ann);

      await service.create(COMMUNITY_ID, 'user-1', { title: ann.title, content: ann.content });

      expect(notificationsService.notifyCommunity).toHaveBeenCalledWith(
        COMMUNITY_ID,
        'user-1',
        expect.objectContaining({ data: { type: 'announcement', communityId: COMMUNITY_ID, announcementId: ann.id } }),
      );
    });
  });

  describe('update', () => {
    it('updates and returns the announcement', async () => {
      const ann = makeAnnouncement();
      const updated = makeAnnouncement({ title: 'Updated' });
      repo.findOne
        .mockResolvedValueOnce(ann)    // findOneEntity call
        .mockResolvedValueOnce(updated); // re-fetch after save
      repo.save.mockResolvedValue(updated);

      const result = await service.update(COMMUNITY_ID, ann.id, { title: 'Updated' });

      expect(result.title).toBe('Updated');
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update(COMMUNITY_ID, 'missing', { title: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes the announcement', async () => {
      const ann = makeAnnouncement();
      repo.findOne.mockResolvedValue(ann);
      repo.remove.mockResolvedValue(undefined);

      await service.remove(COMMUNITY_ID, ann.id);

      expect(repo.remove).toHaveBeenCalledWith(ann);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(COMMUNITY_ID, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('count', () => {
    it('returns the total count', async () => {
      repo.count.mockResolvedValue(3);

      expect(await service.count()).toBe(3);
    });
  });
});
