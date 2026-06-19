import { IsEnum } from 'class-validator';
import { CommunityMemberRole } from '@home-owners-hub/shared-types';

export class UpdateMemberRoleDto {
  @IsEnum(CommunityMemberRole)
  role: CommunityMemberRole;
}
