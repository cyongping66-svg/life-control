import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExternalContentModule } from '../external-content/external-content.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MODEL_PROVIDER, MockModelProvider, OpenAiCompatibleProvider } from './model-provider';

@Module({
  imports: [AuthModule, ExternalContentModule],
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: MODEL_PROVIDER,
      useFactory: () =>
        process.env.AI_PROVIDER === 'openai-compatible'
          ? new OpenAiCompatibleProvider()
          : new MockModelProvider(),
    },
  ],
})
export class AiModule {}
