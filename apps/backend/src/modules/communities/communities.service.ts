import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import {
  Community as CommunityDto,
  CommunityMember as CommunityMemberDto,
  CommunityMemberRole,
  CommunityStats,
  PaginatedResult,
} from '@home-owners-hub/shared-types';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { CommunityMessage } from '../community/entities/community-message.entity';
import { Announcement } from '../announcements/entities/announcement.entity';
import { User } from '../users/entities/user.entity';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { QueryCommunitiesDto } from './dto/query-communities.dto';
import { QueryMembersDto } from './dto/query-members.dto';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepo: Repository<Community>,
    @InjectRepository(CommunityMember)
    private readonly memberRepo: Repository<CommunityMember>,
    @InjectRepository(CommunityMessage)
    private readonly messageRepo: Repository<CommunityMessage>,
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(query: QueryCommunitiesDto): Promise<PaginatedResult<CommunityDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.communityRepo.createQueryBuilder('c')
      .where('c.isActive = :active', { active: true });

    if (query.search) {
      qb.andWhere('c.name ILIKE :search', { search: `%${query.search}%` });
    }

    qb.orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    const dtos = await Promise.all(items.map((c) => this.toDto(c)));
    return { items: dtos, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<CommunityDto> {
    const community = await this.findEntity(id);
    return this.toDto(community);
  }

  async create(userId: string, dto: CreateCommunityDto): Promise<CommunityDto> {
    const code = await this.generateUniqueCode();
    const community = this.communityRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      code,
      createdBy: userId,
    });
    const saved = await this.communityRepo.save(community);

    await this.memberRepo.save(
      this.memberRepo.create({
        userId,
        communityId: saved.id,
        role: CommunityMemberRole.COMMUNITY_ADMIN,
      }),
    );

    return this.toDto(saved);
  }

  async update(id: string, dto: UpdateCommunityDto): Promise<CommunityDto> {
    const community = await this.findEntity(id);
    Object.assign(community, dto);
    const saved = await this.communityRepo.save(community);
    return this.toDto(saved);
  }

  async softDelete(id: string): Promise<void> {
    const community = await this.findEntity(id);
    community.isActive = false;
    await this.communityRepo.save(community);
  }

  async regenerateCode(id: string): Promise<{ code: string }> {
    const community = await this.findEntity(id);
    community.code = await this.generateUniqueCode();
    await this.communityRepo.save(community);
    return { code: community.code };
  }

  async getStats(id: string): Promise<CommunityStats> {
    await this.findEntity(id);
    const [totalMembers, totalMessages, totalAnnouncements] = await Promise.all([
      this.memberRepo.count({ where: { communityId: id } }),
      this.messageRepo.count({ where: { communityId: id } }),
      this.announcementRepo.count({ where: { communityId: id } }),
    ]);
    return { totalMembers, totalMessages, totalAnnouncements };
  }

  // --- Members ---

  async findMembers(communityId: string, query: QueryMembersDto): Promise<PaginatedResult<CommunityMemberDto>> {
    await this.findEntity(communityId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.memberRepo.createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'u')
      .where('m.communityId = :communityId', { communityId });

    if (query.search) {
      qb.andWhere(
        '(u.firstName ILIKE :search OR u.lastName ILIKE :search OR u.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('m.joinedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((m) => this.toMemberDto(m)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchNonMembers(communityId: string, search: string): Promise<{ id: string; email: string; firstName: string; lastName: string }[]> {
    await this.findEntity(communityId);

    const qb = this.userRepo.createQueryBuilder('u')
      .where(`u.id NOT IN (
        SELECT m."userId" FROM community_members m WHERE m."communityId" = :communityId
      )`, { communityId })
      .andWhere('u."isActive" = true');

    if (search) {
      qb.andWhere(
        '(u."firstName" ILIKE :search OR u."lastName" ILIKE :search OR u."email" ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('u."firstName"', 'ASC').limit(20);

    const users = await qb.getMany();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
    }));
  }

  async addMember(communityId: string, dto: AddMemberDto): Promise<CommunityMemberDto> {
    await this.findEntity(communityId);

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new NotFoundException('User not found -- they must register first');
    }

    const existing = await this.memberRepo.findOne({
      where: { userId: user.id, communityId },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this community');
    }

    const member = this.memberRepo.create({
      userId: user.id,
      communityId,
      role: dto.role ?? CommunityMemberRole.COMMUNITY_MEMBER,
    });
    const saved = await this.memberRepo.save(member);
    const withUser = await this.memberRepo.findOne({
      where: { id: saved.id },
      relations: { user: true },
    });
    return this.toMemberDto(withUser!);
  }

  async updateMemberRole(communityId: string, memberId: string, dto: UpdateMemberRoleDto): Promise<CommunityMemberDto> {
    const member = await this.findMemberEntity(communityId, memberId);

    if (
      member.role === CommunityMemberRole.COMMUNITY_ADMIN &&
      dto.role === CommunityMemberRole.COMMUNITY_MEMBER
    ) {
      await this.ensureNotLastAdmin(communityId);
    }

    member.role = dto.role;
    await this.memberRepo.save(member);
    const withUser = await this.memberRepo.findOne({
      where: { id: member.id },
      relations: { user: true },
    });
    return this.toMemberDto(withUser!);
  }

  async removeMember(communityId: string, memberId: string): Promise<void> {
    const member = await this.findMemberEntity(communityId, memberId);

    if (member.role === CommunityMemberRole.COMMUNITY_ADMIN) {
      await this.ensureNotLastAdmin(communityId);
    }

    await this.memberRepo.remove(member);
  }

  // --- Helpers for guards ---

  async getUserMembership(userId: string, communityId: string): Promise<CommunityMember | null> {
    return this.memberRepo.findOne({ where: { userId, communityId } });
  }

  async getUserAdminCommunities(userId: string): Promise<CommunityMember[]> {
    return this.memberRepo.find({
      where: { userId, role: CommunityMemberRole.COMMUNITY_ADMIN },
      relations: { community: true },
    });
  }

  async findByCode(code: string): Promise<Community> {
    const community = await this.communityRepo.findOne({ where: { code, isActive: true } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community;
  }

  async joinByCode(userId: string, code: string): Promise<CommunityDto> {
    const community = await this.findByCode(code);

    const existing = await this.memberRepo.findOne({
      where: { userId, communityId: community.id },
    });
    if (existing) {
      throw new ConflictException('Already a member of this community');
    }

    await this.memberRepo.save(
      this.memberRepo.create({
        userId,
        communityId: community.id,
        role: CommunityMemberRole.COMMUNITY_MEMBER,
      }),
    );

    return this.toDto(community);
  }

  async getUserCommunities(userId: string): Promise<CommunityDto[]> {
    const memberships = await this.memberRepo.find({
      where: { userId },
      relations: { community: true },
    });
    const active = memberships.filter((m) => m.community.isActive);
    return Promise.all(active.map((m) => this.toDto(m.community)));
  }

  async getUserCommunityMemberships(userId: string): Promise<{ communityId: string; communityName: string; role: CommunityMemberRole }[]> {
    const memberships = await this.memberRepo.find({
      where: { userId },
      relations: { community: true },
    });
    return memberships
      .filter((m) => m.community.isActive)
      .map((m) => ({
        communityId: m.community.id,
        communityName: m.community.name,
        role: m.role,
      }));
  }

  // --- Private helpers ---

  private async findEntity(id: string): Promise<Community> {
    const community = await this.communityRepo.findOne({ where: { id } });
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community;
  }

  private async findMemberEntity(communityId: string, memberId: string): Promise<CommunityMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, communityId },
      relations: { user: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    return member;
  }

  private async ensureNotLastAdmin(communityId: string): Promise<void> {
    const adminCount = await this.memberRepo.count({
      where: { communityId, role: CommunityMemberRole.COMMUNITY_ADMIN },
    });
    if (adminCount <= 1) {
      throw new BadRequestException('Cannot remove the last admin of a community');
    }
  }

  private async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      const exists = await this.communityRepo.findOne({ where: { code } });
      if (!exists) return code;
    }
    throw new Error('Failed to generate unique community code');
  }

  private async toDto(community: Community): Promise<CommunityDto> {
    const [memberCount, messageCount, announcementCount] = await Promise.all([
      this.memberRepo.count({ where: { communityId: community.id } }),
      this.messageRepo.count({ where: { communityId: community.id } }),
      this.announcementRepo.count({ where: { communityId: community.id } }),
    ]);
    return {
      id: community.id,
      name: community.name,
      code: community.code,
      description: community.description,
      isActive: community.isActive,
      memberCount,
      messageCount,
      announcementCount,
      createdBy: community.createdBy,
      createdAt: community.createdAt.toISOString(),
      updatedAt: community.updatedAt.toISOString(),
    };
  }

  private toMemberDto(member: CommunityMember): CommunityMemberDto {
    return {
      id: member.id,
      userId: member.userId,
      communityId: member.communityId,
      role: member.role,
      userName: `${member.user.firstName} ${member.user.lastName}`,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      userEmail: member.user.email,
      joinedAt: member.joinedAt.toISOString(),
    };
  }
}
