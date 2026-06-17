import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { AttachmentType } from '@home-owners-hub/shared-types';

export class CreateMessageDto {
  @ValidateIf((o) => !o.attachmentUrl)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsEnum(AttachmentType)
  attachmentType?: AttachmentType;

  @IsOptional()
  @IsString()
  attachmentName?: string;
}
