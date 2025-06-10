import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Template, TemplateDocument } from './template.schema';
import { File, FileDocument } from '../files/file.schema';
import { GridFSBucket } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplatesSeedService {
  private readonly logger = new Logger(TemplatesSeedService.name);
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

  async seedTemplates(): Promise<void> {
    try {
      this.logger.log('Starting template seeding process...');
      
      const existingTemplates = await this.templateModel.countDocuments();
      this.logger.log(`Found ${existingTemplates} existing templates`);
      
      if (existingTemplates > 0) {
        this.logger.log('Templates already exist, skipping seed');
        return;
      }

      const templatesDir = path.join(process.cwd(), 'templates');
      this.logger.log(`Looking for templates in: ${templatesDir}`);
      
      if (!fs.existsSync(templatesDir)) {
        this.logger.error(`Templates directory does not exist: ${templatesDir}`);
        return;
      }

      const templateFolders = fs.readdirSync(templatesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      this.logger.log(`Found template folders: ${templateFolders.join(', ')}`);

      for (const folder of templateFolders) {
        this.logger.log(`Processing template: ${folder}`);
        await this.seedTemplate(path.join(templatesDir, folder), folder);
      }

      this.logger.log(`Successfully seeded ${templateFolders.length} templates`);
    } catch (error) {
      this.logger.error('Error during template seeding:', error);
    }
  }

  private async seedTemplate(templatePath: string, templateName: string): Promise<void> {
    try {
      this.logger.log(`Seeding template from path: ${templatePath}`);
      
      // Check required files
      const requiredFiles = ['thumbnail.png', 'preview.pdf', 'main.tex'];
      for (const file of requiredFiles) {
        const filePath = path.join(templatePath, file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Required file missing: ${filePath}`);
        }
      }

      // Upload files to GridFS
      this.logger.log(`Uploading files for template: ${templateName}`);
      const thumbnailId = await this.uploadFile(path.join(templatePath, 'thumbnail.png'), 'image/png');
      const previewId = await this.uploadFile(path.join(templatePath, 'preview.pdf'), 'application/pdf');
      const mainTexId = await this.uploadFile(path.join(templatePath, 'main.tex'), 'text/plain');
      
      let mainClsId = null;
      const clsPath = path.join(templatePath, 'main.cls');
      if (fs.existsSync(clsPath)) {
        this.logger.log(`Found main.cls file for ${templateName}`);
        mainClsId = await this.uploadFile(clsPath, 'text/plain');
      }

      // Create template document
      const template = new this.templateModel({
        name: templateName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        thumbnail_image_id: thumbnailId,
        preview_pdf_id: previewId,
        main_tex_id: mainTexId,
        main_cls_id: mainClsId,
        author: 'Resume Pilot',
        description: `Professional ${templateName.replace('_', ' ')} template`,
        short_description: `Clean and modern ${templateName.replace('_', ' ')} template`,
        tags: ['professional', 'modern'],
        version: '1.0.0',
        is_active: true,
      });

      const savedTemplate = await template.save();
      this.logger.log(`Successfully seeded template: ${templateName} with ID: ${savedTemplate._id}`);
    } catch (error) {
      this.logger.error(`Failed to seed template ${templateName}:`, error);
      throw error;
    }
  }

  private async uploadFile(filePath: string, mimetype: string): Promise<any> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileName = path.basename(filePath);
      const fileSize = fs.statSync(filePath).size;
      this.logger.log(`Uploading file: ${fileName} (${fileSize} bytes)`);

      const uploadStream = this.gridFSBucket.openUploadStream(fileName);
      const fileStream = fs.createReadStream(filePath);

      await new Promise((resolve, reject) => {
        fileStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', resolve);
      });

      // Create file document
      const fileDoc = new this.fileModel({
        originalName: fileName,
        gridFSId: uploadStream.id,
        mimetype: mimetype,
        size: fileSize,
        tags: ['template'],
        userId: null, // System files
      });

      const savedFile = await fileDoc.save();
      this.logger.log(`File uploaded successfully: ${fileName} with ID: ${savedFile._id}`);
      return savedFile._id;
    } catch (error) {
      this.logger.error(`Failed to upload file ${filePath}:`, error);
      throw error;
    }
  }
} 