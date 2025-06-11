import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GeneratedDocumentsService } from './generated-documents.service';

@Controller('generated-documents')
@UseGuards(JwtAuthGuard)
export class GeneratedDocumentsController {
  constructor(private readonly generatedDocumentsService: GeneratedDocumentsService) {}

  @Get()
  async findAll(@Request() req, @Query('search') search?: string) {
    const userId = req.user.userId;
    return this.generatedDocumentsService.findAllByUser(userId, search);
  }

  @Get(':id/preview')
  async previewDocument(@Param('id') id: string, @Request() req, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.userId;
    const document = await this.generatedDocumentsService.findOne(id, userId);
    
    const stream = await this.generatedDocumentsService.getDocumentStream(document.pdfFileId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${document.name}.pdf"`,
    });

    return new StreamableFile(stream);
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    await this.generatedDocumentsService.delete(id, userId);
    return { message: 'Generated document deleted successfully' };
  }
} 