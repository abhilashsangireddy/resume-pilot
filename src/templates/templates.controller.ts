import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TemplatesService } from './templates.service';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async getAllTemplates() {
    return this.templatesService.getAllTemplates();
  }

  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    return this.templatesService.getTemplateById(id);
  }

  @Get('filter/tags')
  async getTemplatesByTags(@Query('tags') tags: string) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    return this.templatesService.getTemplatesByTags(tagArray);
  }
} 