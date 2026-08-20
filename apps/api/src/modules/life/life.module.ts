import { Module } from '@nestjs/common';
import { EncryptionService } from '../../core/encryption.service';
import { AuthModule } from '../auth/auth.module';
import {
  CareerController,
  ContactController,
  FinanceController,
  ReminderController,
} from './life.controller';
import { LifeService } from './life.service';
import { ReminderDispatchService } from './reminder-dispatch.service';

@Module({
  imports: [AuthModule],
  controllers: [FinanceController, CareerController, ContactController, ReminderController],
  providers: [LifeService, EncryptionService, ReminderDispatchService],
})
export class LifeModule {}
