import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../core/prisma.service';

@Injectable()
export class FilesService {
  private readonly client = new S3Client({
    region: process.env.S3_REGION ?? 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials:
      process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
          }
        : undefined,
  });
  private readonly bucket = process.env.S3_BUCKET ?? 'life-control';

  constructor(private readonly prisma: PrismaService) {}

  async createUploadUrl(
    userId: string,
    input: { purpose: string; filename: string; mimeType: string; size: number },
  ) {
    this.validate(input);
    const safeName = input.filename.replace(/[^\w.\-\u4e00-\u9fa5]/g, '_').slice(-100);
    const objectKey = `users/${userId}/${input.purpose}/${randomUUID()}-${safeName}`;
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ContentType: input.mimeType,
        ContentLength: input.size,
        Metadata: { userId, purpose: input.purpose },
      }),
      { expiresIn: 300 },
    );
    return { objectKey, uploadUrl, expiresIn: 300 };
  }

  async registerResume(
    userId: string,
    input: { name: string; objectKey: string; mimeType: string; size: number },
  ) {
    if (!input.objectKey.startsWith(`users/${userId}/resume/`)) {
      throw new BadRequestException('文件路径无效');
    }
    const latest = await this.prisma.resumeFile.aggregate({
      where: { userId, name: input.name },
      _max: { version: true },
    });
    return this.prisma.resumeFile.create({
      data: {
        userId,
        ...input,
        version: (latest._max.version ?? 0) + 1,
      },
    });
  }

  listResumes(userId: string) {
    return this.prisma.resumeFile.findMany({
      where: { userId },
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
    });
  }

  async createDownloadUrl(userId: string, objectKey: string) {
    const ownedResume = await this.prisma.resumeFile.findFirst({ where: { userId, objectKey } });
    const ownedPhoto = await this.prisma.contact.findFirst({
      where: { userId, photoKey: objectKey },
    });
    if (!ownedResume && !ownedPhoto) throw new NotFoundException('文件不存在');
    const downloadUrl = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      { expiresIn: 60 },
    );
    return { downloadUrl, expiresIn: 60 };
  }

  private validate(input: { purpose: string; filename: string; mimeType: string; size: number }) {
    const rules: Record<string, { types: string[]; max: number }> = {
      resume: {
        types: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        max: 10 * 1024 * 1024,
      },
      'contact-photo': { types: ['image/jpeg', 'image/png', 'image/webp'], max: 5 * 1024 * 1024 },
    };
    const rule = rules[input.purpose];
    if (!rule || !rule.types.includes(input.mimeType) || input.size <= 0 || input.size > rule.max) {
      throw new BadRequestException('文件类型或大小不符合要求');
    }
  }
}
