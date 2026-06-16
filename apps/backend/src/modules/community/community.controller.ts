import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CommunityService } from './community.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('community/messages')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.communityService.findAll(query);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateMessageDto) {
    return this.communityService.create(user.id, dto);
  }
}
