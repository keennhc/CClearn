import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@home-owners-hub/shared-types';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CommunitiesService } from '../communities/communities.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { findByEmail: jest.Mock; findOne: jest.Mock; createRaw: jest.Mock; saveUser: jest.Mock };
  let communitiesService: { getUserCommunityMemberships: jest.Mock; joinByCode: jest.Mock; create: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const password = 'Password1!';
  let passwordHash: string;
  let user: User;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(password, 10);
  });

  beforeEach(async () => {
    user = {
      id: 'user-id',
      email: 'resident@example.com',
      passwordHash,
      firstName: 'Resi',
      lastName: 'Dent',
      role: UserRole.USER,
      isActive: true,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    usersService = { findByEmail: jest.fn(), findOne: jest.fn(), createRaw: jest.fn(), saveUser: jest.fn() };
    communitiesService = { getUserCommunityMemberships: jest.fn(), joinByCode: jest.fn(), create: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: CommunitiesService, useValue: communitiesService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  describe('validateUser', () => {
    it('returns the user when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(user);

      const result = await authService.validateUser(user.email, password);

      expect(result).toEqual(user);
    });

    it('throws when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.validateUser(user.email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws when the user is inactive', async () => {
      usersService.findByEmail.mockResolvedValue({ ...user, isActive: false });

      await expect(authService.validateUser(user.email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws when the password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(user);

      await expect(authService.validateUser(user.email, 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('returns a signed access token', () => {
      const result = authService.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      expect(result).toEqual({ accessToken: 'signed-jwt' });
    });
  });

  describe('getProfile', () => {
    it('returns user profile with communities', async () => {
      usersService.findOne.mockResolvedValue(user);
      communitiesService.getUserCommunityMemberships.mockResolvedValue([]);

      const result = await authService.getProfile(user.id);

      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result.communities).toEqual([]);
    });
  });
});
