import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CommunityMemberGuard } from '../../common/guards/community-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CommunityService } from './community.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('communities/:communityId/messages')
@UseGuards(JwtAuthGuard, CommunityMemberGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  findAll(@Param('communityId', ParseUUIDPipe) communityId: string, @Query() query: PaginationQueryDto) {
    return this.communityService.findAll(communityId, query);
  }

  @Post()
  create(
    @Param('communityId', ParseUUIDPipe) communityId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateMessageDto,
  ) {
    return this.communityService.create(communityId, user.id, dto);
  }
}
