import { ForbiddenException, Injectable } from '@nestjs/common';
import { ContentPlatform, ContentStatus } from '@prisma/client';
import { PrismaService } from '../../core/prisma.service';

@Injectable()
export class ExternalContentService {
  constructor(private readonly prisma: PrismaService) {}

  async search(question: string, limit = 5) {
    const tags = this.extractTags(question);
    const candidates = await this.prisma.externalContent.findMany({
      where: {
        status: ContentStatus.ACTIVE,
        OR:
          tags.length > 0
            ? [{ tags: { hasSome: tags } }, ...tags.map((tag) => ({ title: { contains: tag } }))]
            : undefined,
      },
      take: 20,
      orderBy: [{ verifiedAt: 'desc' }, { interactionCount: 'desc' }],
    });
    return candidates
      .map((content) => ({
        ...content,
        score:
          tags.filter(
            (tag) => content.tags.includes(tag) || content.title.toLowerCase().includes(tag),
          ).length *
            10 +
          (content.platform === ContentPlatform.OFFICIAL ? 5 : 0) +
          Math.log10((content.interactionCount ?? 0) + 1),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  listForAdmin(role: string) {
    this.assertAdmin(role);
    return this.prisma.externalContent.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  createForAdmin(role: string, input: any) {
    this.assertAdmin(role);
    return this.prisma.externalContent.create({
      data: {
        platform: this.platform(input.platform),
        title: input.title,
        summary: input.summary,
        author: input.author,
        url: input.url,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
        interactionCount: input.interactionCount,
        tags: input.tags,
      },
    });
  }

  report(userId: string, contentId: string, reason: string) {
    return this.prisma.contentReport.create({ data: { userId, contentId, reason } });
  }

  listReports(role: string) {
    this.assertAdmin(role);
    return this.prisma.contentReport.findMany({
      include: { content: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private extractTags(question: string) {
    const knownTags = [
      '社保',
      '公积金',
      '医保',
      '养老',
      '银行卡',
      '贷款',
      '信用',
      '简历',
      '面试',
      '副业',
      '生日',
      '同学',
    ];
    return knownTags.filter((tag) => question.includes(tag));
  }

  private platform(value: string) {
    const platforms: Record<string, ContentPlatform> = {
      official: ContentPlatform.OFFICIAL,
      bilibili: ContentPlatform.BILIBILI,
      douyin: ContentPlatform.DOUYIN,
      xiaohongshu: ContentPlatform.XIAOHONGSHU,
      other: ContentPlatform.OTHER,
    };
    return platforms[value] ?? ContentPlatform.OTHER;
  }

  private assertAdmin(role: string) {
    if (role !== 'ADMIN') throw new ForbiddenException('需要管理员权限');
  }
}
