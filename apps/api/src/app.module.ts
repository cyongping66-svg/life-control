import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { CoreModule } from './core/core.module';
import { RequestContextInterceptor } from './core/request-context.interceptor';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { ExternalContentModule } from './modules/external-content/external-content.module';
import { FilesModule } from './modules/files/files.module';
import { LifeModule } from './modules/life/life.module';

@Controller('health')
class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'life-control-api', time: new Date().toISOString() };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string()
          .min(32)
          .when('NODE_ENV', {
            is: 'production',
            then: Joi.required(),
            otherwise: Joi.optional().default('development-only-secret-change-me'),
          }),
        FIELD_ENCRYPTION_KEY: Joi.string().optional(),
        AI_PROVIDER: Joi.string().valid('mock', 'openai-compatible').default('mock'),
      }),
    }),
    ScheduleModule.forRoot(),
    CoreModule,
    AuthModule,
    ExternalContentModule,
    AiModule,
    FilesModule,
    LifeModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: RequestContextInterceptor }],
})
export class AppModule {}
