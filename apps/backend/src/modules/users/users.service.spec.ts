import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@home-owners-hub/shared-types';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

function makeUser(overrides: Partial<User> = {}): User {
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
    ...overrides,
  } as User;
}

describe('UsersService', () => {
  let service: UsersService;
  let repo: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    count: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findAll', () => {
    it('returns paginated users', async () => {
      const user = makeUser();
      repo.findAndCount.mockResolvedValue([[user], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].email).toBe(user.email);
    });

    it('defaults to page 1 and limit 20', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the user when found', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);

      const result = await service.findOne(user.id);

      expect(result).toEqual(user);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns the user', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);

      const result = await service.create({
        email: user.email,
        password: 'Password1!',
        firstName: user.firstName,
        lastName: user.lastName,
        role: UserRole.USER,
      });

      expect(result.email).toBe(user.email);
    });

    it('hashes the password before saving', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((data) => ({ ...user, ...data }));
      repo.save.mockImplementation((u) => Promise.resolve(u));

      await service.create({
        email: user.email,
        password: 'Password1!',
        firstName: user.firstName,
        lastName: user.lastName,
        role: UserRole.USER,
      });

      const created = repo.create.mock.calls[0][0];
      const isHashed = await bcrypt.compare('Password1!', created.passwordHash);
      expect(isHashed).toBe(true);
    });

    it('throws ConflictException when email already exists', async () => {
      repo.findOne.mockResolvedValue(makeUser());

      await expect(
        service.create({
          email: 'test@example.com',
          password: 'Password1!',
          firstName: 'A',
          lastName: 'B',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ForbiddenException when creating with SUPER_ADMIN role', async () => {
      await expect(
        service.create({
          email: 'super@example.com',
          password: 'Password1!',
          firstName: 'Super',
          lastName: 'Admin',
          role: UserRole.SUPER_ADMIN,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('updates and returns the user', async () => {
      const user = makeUser();
      const updated = { ...user, firstName: 'Updated' };
      repo.findOne.mockResolvedValue(user);
      repo.save.mockResolvedValue(updated);

      const result = await service.update(user.id, { firstName: 'Updated' });

      expect(result.firstName).toBe('Updated');
    });

    it('throws ForbiddenException when updating a SUPER_ADMIN user', async () => {
      const superAdmin = makeUser({ role: UserRole.SUPER_ADMIN });
      repo.findOne.mockResolvedValue(superAdmin);

      await expect(
        service.update(superAdmin.id, { firstName: 'Changed' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when promoting to SUPER_ADMIN', async () => {
      const user = makeUser({ role: UserRole.USER });
      repo.findOne.mockResolvedValue(user);

      await expect(
        service.update(user.id, { role: UserRole.SUPER_ADMIN }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when new email belongs to another user', async () => {
      const user = makeUser({ id: 'user-1', email: 'a@example.com' });
      const other = makeUser({ id: 'user-2', email: 'b@example.com' });
      repo.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(other);

      await expect(service.update(user.id, { email: 'b@example.com' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('removes the user', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);
      repo.remove.mockResolvedValue(undefined);

      await service.remove(user.id);

      expect(repo.remove).toHaveBeenCalledWith(user);
    });

    it('throws NotFoundException when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when deleting a SUPER_ADMIN user', async () => {
      const superAdmin = makeUser({ role: UserRole.SUPER_ADMIN });
      repo.findOne.mockResolvedValue(superAdmin);

      await expect(service.remove(superAdmin.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('count', () => {
    it('returns the total count', async () => {
      repo.count.mockResolvedValue(5);

      expect(await service.count()).toBe(5);
    });
  });
});
