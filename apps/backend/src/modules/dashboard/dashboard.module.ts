import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CommunityModule } from '../community/community.module';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [UsersModule, CommunityModule, AnnouncementsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
