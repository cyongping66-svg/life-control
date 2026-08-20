import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from './files.service';

class UploadUrlDto {
  @IsIn(['resume', 'contact-photo'])
  purpose!: string;
  @IsString()
  @MaxLength(200)
  filename!: string;
  @IsString()
  mimeType!: string;
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  size!: number;
}

class ResumeDto {
  @IsString()
  @MaxLength(120)
  name!: string;
  @IsString()
  objectKey!: string;
  @IsString()
  mimeType!: string;
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  size!: number;
}

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload-url')
  uploadUrl(@CurrentUser() user: { id: string }, @Body() body: UploadUrlDto) {
    return this.files.createUploadUrl(user.id, body);
  }

  @Get('download-url')
  downloadUrl(@CurrentUser() user: { id: string }, @Query('objectKey') objectKey: string) {
    return this.files.createDownloadUrl(user.id, objectKey);
  }

  @Get('resumes')
  resumes(@CurrentUser() user: { id: string }) {
    return this.files.listResumes(user.id);
  }

  @Post('resumes')
  registerResume(@CurrentUser() user: { id: string }, @Body() body: ResumeDto) {
    return this.files.registerResume(user.id, body);
  }
}
