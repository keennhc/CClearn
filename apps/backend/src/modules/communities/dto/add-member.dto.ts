import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { CommunityMemberRole } from '@home-owners-hub/shared-types';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(CommunityMemberRole)
  role?: CommunityMemberRole;
}
