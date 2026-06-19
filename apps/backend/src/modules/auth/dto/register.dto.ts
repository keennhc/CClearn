import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateCommunityInRegisterDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  communityCode?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCommunityInRegisterDto)
  createCommunity?: CreateCommunityInRegisterDto;
}
