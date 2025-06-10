import { Controller, Get, Param, Query, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllTemplates() {
    return this.templatesService.getAllTemplates();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getTemplateById(@Param('id') id: string) {
    return this.templatesService.getTemplateById(id);
  }

  @Get(':id/thumbnail')
  async getTemplateThumbnail(@Param('id') id: string, @Res() res: Response) {
    const { stream, mimetype } = await this.templatesService.getTemplateThumbnail(id);
    res.set({
      'Content-Type': mimetype,
      'Cache-Control': 'public, max-age=3600',
    });
    stream.pipe(res);
  }

  @Get(':id/preview')
  async getTemplatePreview(@Param('id') id: string, @Res() res: Response) {
    const { stream, mimetype } = await this.templatesService.getTemplatePreview(id);
    res.set({
      'Content-Type': mimetype,
      'Cache-Control': 'public, max-age=3600',
    });
    stream.pipe(res);
  }

  @Get('filter/tags')
  @UseGuards(JwtAuthGuard)
  async getTemplatesByTags(@Query('tags') tags: string) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    return this.templatesService.getTemplatesByTags(tagArray);
  }
} 