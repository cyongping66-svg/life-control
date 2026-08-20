import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminContentController, ExternalContentController } from './external-content.controller';
import { ExternalContentService } from './external-content.service';

@Module({
  imports: [AuthModule],
  controllers: [ExternalContentController, AdminContentController],
  providers: [ExternalContentService],
  exports: [ExternalContentService],
})
export class ExternalContentModule {}
