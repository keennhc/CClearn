import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunitiesModule } from '../communities/communities.module';
import { PushToken } from './entities/push-token.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ExpoPushClient } from './expo-push.client';

@Module({
  imports: [TypeOrmModule.forFeature([PushToken]), CommunitiesModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, ExpoPushClient],
  exports: [NotificationsService],
})
export class NotificationsModule {}
