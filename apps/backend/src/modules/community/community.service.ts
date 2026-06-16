import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CommunityMessage as CommunityMessageDto,
  PaginatedResult,
} from '@home-owners-hub/shared-types';
import { CommunityMessage } from './entities/community-message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(CommunityMessage)
    private readonly messagesRepository: Repository<CommunityMessage>,
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
    const message = this.messagesRepository.create({ message: dto.message, userId });
    const saved = await this.messagesRepository.save(message);
    const withUser = await this.messagesRepository.findOne({
      where: { id: saved.id },
      relations: { user: true },
    });
    if (!withUser) {
      throw new NotFoundException('Message not found');
    }
    return this.toDto(withUser);
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
      createdAt: message.createdAt.toISOString(),
    };
  }
}
