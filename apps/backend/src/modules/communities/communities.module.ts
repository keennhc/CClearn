import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { CommunityMessage } from '../community/entities/community-message.entity';
import { Announcement } from '../announcements/entities/announcement.entity';
import { User } from '../users/entities/user.entity';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Community, CommunityMember, CommunityMessage, Announcement, User]),
  ],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
  exports: [CommunitiesService],
})
export class CommunitiesModule {}
