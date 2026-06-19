import { IsEmail, IsEnum } from 'class-validator';
import { CommunityMemberRole } from '@home-owners-hub/shared-types';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(CommunityMemberRole)
  role: CommunityMemberRole;
}
