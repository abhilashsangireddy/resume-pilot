import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Template, TemplateDocument } from './template.schema';
import { File, FileDocument } from '../files/file.schema';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

@Injectable()
export class TemplatesService {
  private gridFSBucket: GridFSBucket;

  constructor(
    @InjectModel(Template.name) private templateModel: Model<TemplateDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @InjectConnection() private connection: Connection,
  ) {
    if (!this.connection.db) {
      throw new Error('Database connection not established');
    }
    this.gridFSBucket = new GridFSBucket(this.connection.db);
  }

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

  async getTemplateThumbnail(templateId: string): Promise<{
    stream: Readable;
    mimetype: string;
  }> {
    const template = await this.templateModel.findById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const file = await this.fileModel.findById(template.thumbnail_image_id);
    if (!file) {
      throw new NotFoundException('Thumbnail file not found');
    }

    const downloadStream = this.gridFSBucket.openDownloadStream(file.gridFSId);
    
    return {
      stream: downloadStream,
      mimetype: file.mimetype,
    };
  }

  async getTemplatePreview(templateId: string): Promise<{
    stream: Readable;
    mimetype: string;
  }> {
    const template = await this.templateModel.findById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const file = await this.fileModel.findById(template.preview_pdf_id);
    if (!file) {
      throw new NotFoundException('Preview file not found');
    }

    const downloadStream = this.gridFSBucket.openDownloadStream(file.gridFSId);
    
    return {
      stream: downloadStream,
      mimetype: file.mimetype,
    };
  }
} 