import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExternalContentService } from './external-content.service';

class ReportDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}

class CreateContentDto {
  @IsIn(['official', 'bilibili', 'douyin', 'xiaohongshu', 'other'])
  platform!: string;
  @IsString()
  @MaxLength(200)
  title!: string;
  @IsString()
  @MaxLength(1000)
  summary!: string;
  @IsOptional()
  @IsString()
  author?: string;
  @IsUrl({ require_protocol: true })
  url!: string;
  @IsOptional()
  @IsISO8601()
  publishedAt?: string;
  @IsOptional()
  @IsInt()
  @Min(0)
  interactionCount?: number;
  @IsArray()
  @IsString({ each: true })
  tags!: string[];
}

@UseGuards(JwtAuthGuard)
@Controller('external-contents')
export class ExternalContentController {
  constructor(private readonly contents: ExternalContentService) {}

  @Post(':id/reports')
  report(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReportDto,
  ) {
    return this.contents.report(user.id, id, body.reason);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminContentController {
  constructor(private readonly contents: ExternalContentService) {}

  @Get('external-contents')
  list(@CurrentUser() user: { role: string }) {
    return this.contents.listForAdmin(user.role);
  }

  @Post('external-contents')
  create(@CurrentUser() user: { role: string }, @Body() body: CreateContentDto) {
    return this.contents.createForAdmin(user.role, body);
  }

  @Get('content-reports')
  reports(@CurrentUser() user: { role: string }) {
    return this.contents.listReports(user.role);
  }
}
