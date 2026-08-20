import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { LifeCategory as DbCategory } from '../../generated/prisma/client';
import { ExternalContentService } from '../external-content/external-content.service';
import { type LifeCategory, MODEL_PROVIDER, type ModelProvider } from './model-provider';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contents: ExternalContentService,
    @Inject(MODEL_PROVIDER) private readonly model: ModelProvider,
  ) {}

  async ask(userId: string, question: string) {
    const category = this.classify(question);
    const sources = await this.contents.search(question);
    const answer = await this.model.generate({
      question,
      category,
      sources: sources.map(({ title, summary, url }) => ({ title, summary, url })),
    });
    const disclaimer =
      category === 'finance' ? '仅供信息参考，不构成财务、法律或政策办理意见。' : null;
    const saved = await this.prisma.question.create({
      data: {
        userId,
        text: question,
        answer,
        category: this.dbCategory(category),
        disclaimer,
        sources: {
          create: sources.map((source, rank) => ({
            rank,
            content: { connect: { id: source.id } },
          })),
        },
      },
      include: { sources: { include: { content: true }, orderBy: { rank: 'asc' } } },
    });
    return this.toAnswer(saved);
  }

  async history(userId: string) {
    const questions = await this.prisma.question.findMany({
      where: { userId },
      include: { sources: { include: { content: true }, orderBy: { rank: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return questions.map((question) => this.toAnswer(question));
  }

  classify(question: string): LifeCategory {
    if (/社保|公积金|医保|银行卡|贷款|信用|预算|理财|账单/.test(question)) return 'finance';
    if (/工作|职业|简历|面试|升职|副业|离职/.test(question)) return 'career';
    if (/朋友|同学|生日|社交|联系人|关系/.test(question)) return 'social';
    return 'general';
  }

  private dbCategory(category: LifeCategory) {
    return {
      finance: DbCategory.FINANCE,
      career: DbCategory.CAREER,
      social: DbCategory.SOCIAL,
      general: DbCategory.GENERAL,
    }[category];
  }

  private toAnswer(question: any) {
    return {
      id: question.id,
      question: question.text,
      answer: question.answer,
      category: String(question.category).toLowerCase(),
      disclaimer: question.disclaimer,
      createdAt: question.createdAt,
      sources: question.sources.map(({ content }: any) => ({
        id: content.id,
        platform: String(content.platform).toLowerCase(),
        title: content.title,
        summary: content.summary,
        author: content.author,
        url: content.url,
        publishedAt: content.publishedAt,
        verifiedAt: content.verifiedAt,
        interactionCount: content.interactionCount,
      })),
    };
  }
}
