import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@home-owners-hub/shared-types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CommunityAdminGuard } from '../../common/guards/community-admin.guard';
import { CommunityMemberGuard } from '../../common/guards/community-member.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { QueryCommunitiesDto } from './dto/query-communities.dto';
import { QueryMembersDto } from './dto/query-members.dto';

@Controller('communities')
@UseGuards(JwtAuthGuard)
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  findAll(@Query() query: QueryCommunitiesDto) {
    return this.communitiesService.findAll(query);
  }

  @Get('mine')
  getMyCommunities(@CurrentUser() user: { id: string }) {
    return this.communitiesService.getUserCommunities(user.id);
  }

  @Post('join')
  joinByCode(@CurrentUser() user: { id: string }, @Body('code') code: string) {
    return this.communitiesService.joinByCode(user.id, code);
  }

  @Get(':id')
  @UseGuards(CommunityMemberGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.communitiesService.findOne(id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateCommunityDto) {
    return this.communitiesService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(CommunityAdminGuard)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCommunityDto) {
    return this.communitiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.communitiesService.softDelete(id);
  }

  @Post(':id/regenerate-code')
  @UseGuards(CommunityAdminGuard)
  regenerateCode(@Param('id', ParseUUIDPipe) id: string) {
    return this.communitiesService.regenerateCode(id);
  }

  @Get(':id/stats')
  @UseGuards(CommunityMemberGuard)
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.communitiesService.getStats(id);
  }

  @Get(':id/members')
  @UseGuards(CommunityAdminGuard)
  findMembers(@Param('id', ParseUUIDPipe) id: string, @Query() query: QueryMembersDto) {
    return this.communitiesService.findMembers(id, query);
  }

  @Get(':id/non-members')
  @UseGuards(CommunityAdminGuard)
  searchNonMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('search') search: string,
  ) {
    return this.communitiesService.searchNonMembers(id, search ?? '');
  }

  @Post(':id/members')
  @UseGuards(CommunityAdminGuard)
  addMember(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddMemberDto) {
    return this.communitiesService.addMember(id, dto);
  }

  @Patch(':id/members/:memberId')
  @UseGuards(CommunityAdminGuard)
  updateMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.communitiesService.updateMemberRole(id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(CommunityAdminGuard)
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.communitiesService.removeMember(id, memberId);
  }
}
