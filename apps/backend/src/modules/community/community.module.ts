import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityMessage } from './entities/community-message.entity';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { CommunityGateway } from './community.gateway';
import { CommunitiesModule } from '../communities/communities.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommunityMessage]),
    CommunitiesModule,
    NotificationsModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService, CommunityGateway],
  exports: [CommunityService],
})
export class CommunityModule {}
