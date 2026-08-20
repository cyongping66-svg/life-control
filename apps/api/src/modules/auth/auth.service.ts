import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../core/prisma.service';

type WechatSession = { openid?: string; errcode?: number; errmsg?: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async loginWithWechat(code: string) {
    const appId = process.env.WECHAT_APP_ID;
    const secret = process.env.WECHAT_APP_SECRET;
    if (!appId || !secret) {
      throw new UnauthorizedException('微信登录尚未配置');
    }

    const params = new URLSearchParams({
      appid: appId,
      secret,
      js_code: code,
      grant_type: 'authorization_code',
    });
    const response = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?${params.toString()}`,
    );
    const session = (await response.json()) as WechatSession;
    if (!response.ok || !session.openid) {
      throw new UnauthorizedException(session.errmsg ?? '微信登录失败');
    }

    const user = await this.prisma.user.upsert({
      where: { wechatOpenId: session.openid },
      update: {},
      create: { wechatOpenId: session.openid },
    });
    return this.issueToken(user.id, user.role);
  }

  async loginForDevelopment(displayName = '本地体验用户') {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('生产环境禁止本地登录');
    }
    const user = await this.prisma.user.upsert({
      where: { wechatOpenId: 'development-user' },
      update: { displayName },
      create: { wechatOpenId: 'development-user', displayName },
    });
    return this.issueToken(user.id, user.role);
  }

  private issueToken(userId: string, role: string) {
    return {
      accessToken: this.jwt.sign({ sub: userId, role }),
      user: { id: userId, role },
    };
  }
}
