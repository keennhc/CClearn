import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AttachmentType,
  CommunityMessage as CommunityMessageDto,
  PaginatedResult,
} from '@home-owners-hub/shared-types';
import { CommunityMessage } from './entities/community-message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CommunityGateway } from './community.gateway';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(CommunityMessage)
    private readonly messagesRepository: Repository<CommunityMessage>,
    private readonly gateway: CommunityGateway,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<CommunityMessageDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.messagesRepository.findAndCount({
      relations: { user: true },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((message) => this.toDto(message)),
      total,
      page,
      limit,
    };
  }

  async create(userId: string, dto: CreateMessageDto): Promise<CommunityMessageDto> {
    const message = this.messagesRepository.create({
      message: dto.message ?? null,
      userId,
      attachmentUrl: dto.attachmentUrl ?? null,
      attachmentType: dto.attachmentType ?? null,
      attachmentName: dto.attachmentName ?? null,
    });
    const saved = await this.messagesRepository.save(message);
    const withUser = await this.messagesRepository.findOne({
      where: { id: saved.id },
      relations: { user: true },
    });
    if (!withUser) {
      throw new NotFoundException('Message not found');
    }
    const result = this.toDto(withUser);
    this.gateway.broadcastMessage(result);
    return result;
  }

  async count(): Promise<number> {
    return this.messagesRepository.count();
  }

  private toDto(message: CommunityMessage): CommunityMessageDto {
    return {
      id: message.id,
      message: message.message,
      userId: message.userId,
      userName: `${message.user.firstName} ${message.user.lastName}`,
      userRole: message.user.role,
      attachmentUrl: message.attachmentUrl ?? null,
      attachmentType: (message.attachmentType as AttachmentType) ?? null,
      attachmentName: message.attachmentName ?? null,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
