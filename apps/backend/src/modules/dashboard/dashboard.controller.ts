import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardStats, UserRole } from '@home-owners-hub/shared-types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { CommunityService } from '../community/community.service';
import { AnnouncementsService } from '../announcements/announcements.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class DashboardController {
  constructor(
    private readonly usersService: UsersService,
    private readonly communityService: CommunityService,
    private readonly announcementsService: AnnouncementsService,
  ) {}

  @Get('stats')
  async getStats(): Promise<DashboardStats> {
    const [totalUsers, totalMessages, totalAnnouncements] = await Promise.all([
      this.usersService.count(),
      this.communityService.count(),
      this.announcementsService.count(),
    ]);

    return { totalUsers, totalMessages, totalAnnouncements };
  }
}
