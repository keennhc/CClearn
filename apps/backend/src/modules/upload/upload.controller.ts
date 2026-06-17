import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

const VALID_FOLDERS = ['profile-images', 'chat-media'] as const;
const PROFILE_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!VALID_FOLDERS.includes(folder as (typeof VALID_FOLDERS)[number])) {
      throw new BadRequestException('Invalid folder');
    }

    if (folder === 'profile-images') {
      if (file.size > PROFILE_IMAGE_MAX_SIZE) {
        throw new BadRequestException('Profile image must be under 5MB');
      }
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Only image files are allowed for profile images');
      }
    }

    return this.uploadService.upload(file, folder);
  }
}
