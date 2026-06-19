import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement as AnnouncementDto } from '@home-owners-hub/shared-types';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementsRepository: Repository<Announcement>,
  ) {}

  async findAll(communityId: string): Promise<AnnouncementDto[]> {
    const announcements = await this.announcementsRepository.find({
      where: { communityId },
      order: { createdAt: 'DESC' },
    });
    return announcements.map((announcement) => this.toDto(announcement));
  }

  async create(communityId: string, userId: string, dto: CreateAnnouncementDto): Promise<AnnouncementDto> {
    const announcement = this.announcementsRepository.create({
      title: dto.title,
      content: dto.content,
      communityId,
      createdBy: userId,
    });
    const saved = await this.announcementsRepository.save(announcement);
    return this.toDto(saved);
  }

  async update(communityId: string, id: string, dto: UpdateAnnouncementDto): Promise<AnnouncementDto> {
    const announcement = await this.findOneEntity(communityId, id);
    Object.assign(announcement, dto);
    const saved = await this.announcementsRepository.save(announcement);
    return this.toDto(saved);
  }

  async remove(communityId: string, id: string): Promise<void> {
    const announcement = await this.findOneEntity(communityId, id);
    await this.announcementsRepository.remove(announcement);
  }

  async count(): Promise<number> {
    return this.announcementsRepository.count();
  }

  private async findOneEntity(communityId: string, id: string): Promise<Announcement> {
    const announcement = await this.announcementsRepository.findOne({
      where: { id, communityId },
    });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    return announcement;
  }

  private toDto(announcement: Announcement): AnnouncementDto {
    return {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      communityId: announcement.communityId,
      createdBy: announcement.createdBy,
      createdAt: announcement.createdAt.toISOString(),
      updatedAt: announcement.updatedAt.toISOString(),
    };
  }
}
