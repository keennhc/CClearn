import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementsService } from './announcements.service';

function makeAnnouncement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: 'ann-1',
    title: 'Test Title',
    content: 'Test content.',
    createdBy: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    author: {} as never,
    ...overrides,
  } as Announcement;
}

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: getRepositoryToken(Announcement), useValue: repo },
      ],
    }).compile();

    service = module.get(AnnouncementsService);
  });

  describe('findAll', () => {
    it('returns all announcements ordered by createdAt DESC', async () => {
      const ann = makeAnnouncement();
      repo.find.mockResolvedValue([ann]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe(ann.title);
      expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });
  });

  describe('create', () => {
    it('creates and returns the announcement', async () => {
      const ann = makeAnnouncement();
      repo.create.mockReturnValue(ann);
      repo.save.mockResolvedValue(ann);

      const result = await service.create('user-1', {
        title: ann.title,
        content: ann.content,
      });

      expect(result.title).toBe(ann.title);
      expect(result.createdBy).toBe(ann.createdBy);
    });
  });

  describe('update', () => {
    it('updates and returns the announcement', async () => {
      const ann = makeAnnouncement();
      const updated = { ...ann, title: 'Updated' };
      repo.findOne.mockResolvedValue(ann);
      repo.save.mockResolvedValue(updated);

      const result = await service.update(ann.id, { title: 'Updated' });

      expect(result.title).toBe('Updated');
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update('missing', { title: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes the announcement', async () => {
      const ann = makeAnnouncement();
      repo.findOne.mockResolvedValue(ann);
      repo.remove.mockResolvedValue(undefined);

      await service.remove(ann.id);

      expect(repo.remove).toHaveBeenCalledWith(ann);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('count', () => {
    it('returns the total count', async () => {
      repo.count.mockResolvedValue(3);

      expect(await service.count()).toBe(3);
    });
  });
});
