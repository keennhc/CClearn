import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CommunityMemberGuard } from '../../common/guards/community-member.guard';
import { CommunityAdminGuard } from '../../common/guards/community-admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Controller('communities/:communityId/announcements')
@UseGuards(JwtAuthGuard, CommunityMemberGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  findAll(@Param('communityId', ParseUUIDPipe) communityId: string) {
    return this.announcementsService.findAll(communityId);
  }

  @Post()
  @UseGuards(CommunityAdminGuard)
  create(
    @Param('communityId', ParseUUIDPipe) communityId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.create(communityId, user.id, dto);
  }

  @Patch(':id')
  @UseGuards(CommunityAdminGuard)
  update(
    @Param('communityId', ParseUUIDPipe) communityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(communityId, id, dto);
  }

  @Delete(':id')
  @UseGuards(CommunityAdminGuard)
  remove(
    @Param('communityId', ParseUUIDPipe) communityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.announcementsService.remove(communityId, id);
  }
}
