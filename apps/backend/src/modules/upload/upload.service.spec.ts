import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { AttachmentType } from '@home-owners-hub/shared-types';
import { UploadService } from './upload.service';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
}));

function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 100,
    fieldname: 'file',
    encoding: '7bit',
    stream: null as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

function makeConfigValue(overrides: Record<string, string> = {}) {
  return {
    bucket: 'test-bucket',
    region: 'us-east-1',
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret',
    endpoint: '',
    ...overrides,
  };
}

async function createService(configOverrides: Record<string, string> = {}) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      UploadService,
      {
        provide: ConfigService,
        useValue: { get: () => makeConfigValue(configOverrides) },
      },
    ],
  }).compile();
  return module.get(UploadService);
}

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    service = await createService();
  });

  it('returns a valid upload result with S3 URL', async () => {
    const file = makeFile();
    const result = await service.upload(file, 'profile-images');

    expect(result.url).toContain('https://test-bucket.s3.us-east-1.amazonaws.com/profile-images/');
    expect(result.url).toMatch(/\.jpg$/);
    expect(result.key).toContain('profile-images/');
    expect(result.name).toBe('photo.jpg');
    expect(result.type).toBe(AttachmentType.IMAGE);
  });

  it('uses path-style URL when endpoint is set', async () => {
    service = await createService({ endpoint: 'http://localhost:4566' });
    const file = makeFile();
    const result = await service.upload(file, 'profile-images');

    expect(result.url).toContain('http://localhost:4566/test-bucket/profile-images/');
    expect(result.url).toMatch(/\.jpg$/);
  });

  it('throws when bucket is not configured', async () => {
    service = await createService({ bucket: '' });
    const file = makeFile();

    await expect(service.upload(file, 'profile-images')).rejects.toThrow(BadRequestException);
  });

  it('detects GIF type', async () => {
    const file = makeFile({ originalname: 'anim.gif', mimetype: 'image/gif' });
    const result = await service.upload(file, 'chat-media');
    expect(result.type).toBe(AttachmentType.GIF);
  });

  it('detects VIDEO type', async () => {
    const file = makeFile({ originalname: 'clip.mp4', mimetype: 'video/mp4' });
    const result = await service.upload(file, 'chat-media');
    expect(result.type).toBe(AttachmentType.VIDEO);
  });

  it('detects FILE type for non-media', async () => {
    const file = makeFile({ originalname: 'doc.pdf', mimetype: 'application/pdf' });
    const result = await service.upload(file, 'chat-media');
    expect(result.type).toBe(AttachmentType.FILE);
  });
});
