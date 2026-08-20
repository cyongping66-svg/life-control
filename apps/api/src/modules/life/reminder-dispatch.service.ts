import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../core/prisma.service';
import { ReminderChannel, ReminderStatus } from '../../generated/prisma/client';

@Injectable()
export class ReminderDispatchService {
  private readonly logger = new Logger(ReminderDispatchService.name);
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 * * * * *')
  async dispatchDueReminders() {
    const reminders = await this.prisma.reminder.findMany({
      where: { status: ReminderStatus.PENDING, remindAt: { lte: new Date() } },
      include: { user: true },
      take: 100,
    });
    for (const reminder of reminders) {
      if (reminder.channel === ReminderChannel.IN_APP) {
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.SENT },
        });
        continue;
      }
      try {
        await this.sendWechat(reminder.user.wechatOpenId, reminder.title, reminder.remindAt);
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.SENT },
        });
      } catch (error) {
        this.logger.warn(`微信提醒发送失败 reminder=${reminder.id}: ${String(error)}`);
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.FAILED },
        });
      }
    }
  }

  private async sendWechat(openId: string | null, title: string, remindAt: Date) {
    const appId = process.env.WECHAT_APP_ID;
    const secret = process.env.WECHAT_APP_SECRET;
    const templateId = process.env.WECHAT_REMINDER_TEMPLATE_ID;
    if (!openId || !appId || !secret || !templateId) throw new Error('微信订阅消息配置不完整');

    const tokenResponse = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(secret)}`,
    );
    const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenPayload.access_token) throw new Error('无法获取微信 access_token');

    const response = await fetch(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${encodeURIComponent(tokenPayload.access_token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: openId,
          template_id: templateId,
          page: 'pages/reminders/index',
          data: {
            thing1: { value: title.slice(0, 20) },
            time2: { value: remindAt.toISOString().slice(0, 16).replace('T', ' ') },
          },
        }),
      },
    );
    const result = (await response.json()) as { errcode?: number; errmsg?: string };
    if (!response.ok || result.errcode) throw new Error(result.errmsg ?? '订阅消息发送失败');
  }
}
