import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template, TemplateDocument } from './template.schema';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name) private templateModel: Model<TemplateDocument>,
  ) {}

  async getAllTemplates(): Promise<Template[]> {
    return this.templateModel.find().exec();
  }

  async getTemplateById(id: string): Promise<Template> {
    const template = await this.templateModel.findById(id).exec();
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async getTemplatesByTags(tags: string[]): Promise<Template[]> {
    return this.templateModel.find({
      tags: { $in: tags }
    }).exec();
  }
} 