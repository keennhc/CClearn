import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { AttachmentType, UploadResult } from '@home-owners-hub/shared-types';
import { AppConfig } from '../../config/configuration';

@Injectable()
export class UploadService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    const s3Config = this.configService.get('s3', { infer: true });
    this.bucket = s3Config.bucket;
    this.region = s3Config.region;
    this.endpoint = s3Config.endpoint;

    const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region: this.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    };

    if (this.endpoint) {
      clientConfig.endpoint = this.endpoint;
      clientConfig.forcePathStyle = true;
    }

    this.s3 = new S3Client(clientConfig);
  }

  async upload(file: Express.Multer.File, folder: string): Promise<UploadResult> {
    if (!this.bucket) {
      throw new BadRequestException('S3 is not configured. Set AWS_S3_BUCKET in your environment.');
    }

    const ext = extname(file.originalname).toLowerCase();
    const key = `${folder}/${randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = this.endpoint
      ? `${this.endpoint}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    const type = this.detectType(file.mimetype);

    return { url, key, type, name: file.originalname };
  }

  private detectType(mimetype: string): AttachmentType {
    if (mimetype === 'image/gif') return AttachmentType.GIF;
    if (mimetype.startsWith('image/')) return AttachmentType.IMAGE;
    if (mimetype.startsWith('video/')) return AttachmentType.VIDEO;
    return AttachmentType.FILE;
  }
}
