import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResumeService } from './resume.service';

@Controller('resume')
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('generate')
  async generateResume(
    @Body() generateResumeDto: {
      templateId: string;
      documentId: string;
      instructions: string;
    },
    @Request() req,
  ) {
    const { templateId, documentId, instructions } = generateResumeDto;
    const userId = req.user.userId;

    // Validate required fields
    if (!documentId || !instructions) {
      throw new BadRequestException('Document ID and instructions are required');
    }

    return this.resumeService.generateResume(
      userId,
      templateId,
      documentId,
      instructions,
    );
  }
} 