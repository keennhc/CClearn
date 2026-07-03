import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PushToken } from './entities/push-token.entity';
import { RegisterTokenDto } from './dto/register-token.dto';
import { ExpoPushClient } from './expo-push.client';
import { CommunitiesService } from '../communities/communities.service';

export interface CommunityNotificationPayload {
  title: string;
  body: string;
  data: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(PushToken)
    private readonly tokenRepo: Repository<PushToken>,
    private readonly communitiesService: CommunitiesService,
    private readonly expo: ExpoPushClient,
  ) {}

  async registerToken(userId: string, dto: RegisterTokenDto): Promise<void> {
    const existing = await this.tokenRepo.findOne({ where: { token: dto.token } });
    if (existing) {
      existing.userId = userId;
      existing.platform = dto.platform;
      await this.tokenRepo.save(existing);
      return;
    }
    const created = this.tokenRepo.create({ userId, token: dto.token, platform: dto.platform });
    await this.tokenRepo.save(created);
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    await this.tokenRepo.delete({ userId, token });
  }

  // Fire-and-forget from callers' perspective: never throws, so a push
  // failure can never fail the message/announcement request that triggered it.
  async notifyCommunity(communityId: string, excludeUserId: string, payload: CommunityNotificationPayload): Promise<void> {
    try {
      const memberUserIds = await this.communitiesService.getCommunityMemberUserIds(communityId);
      const targetUserIds = memberUserIds.filter((id) => id !== excludeUserId);
      if (targetUserIds.length === 0) return;

      const tokens = await this.tokenRepo.find({ where: { userId: In(targetUserIds) } });
      if (tokens.length === 0) return;

      const messages = tokens
        .filter((t) => this.expo.isValidToken(t.token))
        .map((t) => ({ to: t.token, title: payload.title, body: payload.body, data: payload.data }));

      await this.expo.send(messages);
    } catch (error) {
      this.logger.error(`Failed to notify community ${communityId}`, error as Error);
    }
  }
}
