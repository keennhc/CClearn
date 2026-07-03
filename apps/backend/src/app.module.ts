import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CommunityModule } from './modules/community/community.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadModule } from './modules/upload/upload.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CommunitiesModule,
    CommunityModule,
    AnnouncementsModule,
    DashboardModule,
    UploadModule,
    AiChatModule,
    NotificationsModule,
  ],
})
export class AppModule {}
