import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';

class AskDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  question!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('questions')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post()
  ask(@CurrentUser() user: { id: string }, @Body() body: AskDto) {
    return this.ai.ask(user.id, body.question.trim());
  }

  @Get()
  history(@CurrentUser() user: { id: string }) {
    return this.ai.history(user.id);
  }
}
