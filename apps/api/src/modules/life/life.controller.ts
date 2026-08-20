import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LifeService } from './life.service';

class FinanceDto {
  @IsIn(['bank-card', 'payment-account', 'loan', 'credit'])
  kind!: string;

  @IsString()
  @MaxLength(100)
  institution!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  alias?: string | null;

  @IsOptional()
  @Length(4, 4)
  @Matches(/^\d{4}$/)
  lastFour?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  billingDay?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  repaymentDay?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
class UpdateFinanceDto extends PartialType(FinanceDto) {}

class CareerDto {
  @IsIn(['goal', 'resume', 'side-project'])
  kind!: string;

  @IsString()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsIn(['planned', 'active', 'paused', 'completed'])
  status?: string;

  @IsOptional()
  @IsISO8601()
  targetDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null;
}
class UpdateCareerDto extends PartialType(CareerDto) {}

class ContactDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  className?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @IsOptional()
  @Matches(/^\d{2}-\d{2}$/)
  birthday?: string | null;

  @IsOptional()
  @IsString()
  photoKey?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string | null;
}
class UpdateContactDto extends PartialType(ContactDto) {}

class ReminderDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsISO8601()
  remindAt!: string;

  @IsIn(['in-app', 'wechat'])
  channel!: string;
}

type User = { id: string };

@UseGuards(JwtAuthGuard)
@Controller('finance-items')
export class FinanceController {
  constructor(private readonly life: LifeService) {}
  @Get()
  list(@CurrentUser() user: User) {
    return this.life.listFinance(user.id);
  }
  @Post()
  create(@CurrentUser() user: User, @Body() body: FinanceDto) {
    return this.life.createFinance(user.id, body);
  }
  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFinanceDto,
  ) {
    return this.life.updateFinance(user.id, id, body);
  }
  @Delete(':id')
  delete(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.life.deleteFinance(user.id, id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('career-items')
export class CareerController {
  constructor(private readonly life: LifeService) {}
  @Get()
  list(@CurrentUser() user: User) {
    return this.life.listCareer(user.id);
  }
  @Post()
  create(@CurrentUser() user: User, @Body() body: CareerDto) {
    return this.life.createCareer(user.id, body);
  }
  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCareerDto,
  ) {
    return this.life.updateCareer(user.id, id, body);
  }
  @Delete(':id')
  delete(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.life.deleteCareer(user.id, id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactController {
  constructor(private readonly life: LifeService) {}
  @Get()
  list(@CurrentUser() user: User, @Query('search') search?: string) {
    return this.life.listContacts(user.id, search);
  }
  @Post()
  create(@CurrentUser() user: User, @Body() body: ContactDto) {
    return this.life.createContact(user.id, body);
  }
  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateContactDto,
  ) {
    return this.life.updateContact(user.id, id, body);
  }
  @Delete(':id')
  delete(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.life.deleteContact(user.id, id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class ReminderController {
  constructor(private readonly life: LifeService) {}
  @Get()
  list(@CurrentUser() user: User) {
    return this.life.listReminders(user.id);
  }
  @Post()
  create(@CurrentUser() user: User, @Body() body: ReminderDto) {
    return this.life.createReminder(user.id, body);
  }
  @Delete(':id')
  delete(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.life.deleteReminder(user.id, id);
  }
}
