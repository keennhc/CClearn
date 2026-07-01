import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthProfile, LoginResponse } from '@home-owners-hub/shared-types';
import { UsersService } from '../users/users.service';
import { CommunitiesService } from '../communities/communities.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly communitiesService: CommunitiesService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  login(user: User): LoginResponse {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async register(dto: RegisterDto): Promise<LoginResponse> {
    if (dto.communityCode && dto.createCommunity) {
      throw new BadRequestException('Cannot both join and create a community during registration');
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.createRaw({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    if (dto.communityCode) {
      await this.communitiesService.joinByCode(user.id, dto.communityCode);
    } else if (dto.createCommunity) {
      await this.communitiesService.create(user.id, dto.createCommunity);
    }

    return this.login(user);
  }

  async getProfile(userId: string): Promise<AuthProfile> {
    const user = await this.usersService.findOne(userId);
    const communities = await this.communitiesService.getUserCommunityMemberships(userId);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profileImageUrl: user.profileImageUrl ?? null,
      communities,
    };
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string; profileImageUrl?: string | null }): Promise<AuthProfile> {
    const user = await this.usersService.findOne(userId);
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.profileImageUrl !== undefined) user.profileImageUrl = dto.profileImageUrl ?? null;
    await this.usersService.saveUser(user);
    return this.getProfile(userId);
  }
}
