import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class WechatLoginDto {
  @IsString()
  @MinLength(1)
  code!: string;
}

class DevelopmentLoginDto {
  @IsOptional()
  @IsString()
  displayName?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('wechat')
  @ApiOperation({ summary: '使用 wx.login 临时 code 登录' })
  loginWithWechat(@Body() body: WechatLoginDto) {
    return this.auth.loginWithWechat(body.code);
  }

  @Post('development')
  @ApiOperation({ summary: '仅开发环境可用的体验登录' })
  loginForDevelopment(@Body() body: DevelopmentLoginDto) {
    return this.auth.loginForDevelopment(body.displayName);
  }
}
