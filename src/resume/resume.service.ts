import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { File, FileDocument } from '../files/file.schema';
import { Template, TemplateDocument } from '../templates/template.schema';
import { GridFSBucket } from 'mongodb';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class ResumeService {
  private gridFSBucket: GridFSBucket;

  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @InjectModel(Template.name) private templateModel: Model<TemplateDocument>,
    @InjectConnection() private connection: Connection,
  ) {
    if (!this.connection.db) {
      throw new Error('Database connection not established');
    }
    this.gridFSBucket = new GridFSBucket(this.connection.db);
  }

  async generateResume(
    userId: string,
    templateId: string,
    documentId: string,
    instructions: string,
  ): Promise<{ extractedText: string; template?: any; document: any }> {
    // Fetch the document
    const document = await this.fileModel.findOne({
      _id: documentId,
      userId: new Types.ObjectId(userId),
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check systemGen flag and template requirement
    let template: TemplateDocument | null = null;
    if (document.systemGen === false) {
      // Template is required when systemGen is false
      if (!templateId) {
        throw new BadRequestException(
          'Template is required when document is not system generated',
        );
      }

      template = await this.templateModel.findById(templateId);
      if (!template) {
        throw new NotFoundException('Template not found');
      }
    } else if (document.systemGen === true) {
      // Template is ignored when systemGen is true
      template = null;
    } else {
      // If systemGen is not set, default behavior - require template
      if (!templateId) {
        throw new BadRequestException('Template is required');
      }

      template = await this.templateModel.findById(templateId);
      if (!template) {
        throw new NotFoundException('Template not found');
      }
    }

    // Extract PDF content
    const extractedText = await this.extractPdfContent(document);

    // For now, return the extracted content
    // TODO: Integrate with OpenAI ChatGPT API
    return {
      extractedText,
      template: template ? template.toObject() : null,
      document: document.toObject(),
    };
  }

  private async extractPdfContent(document: FileDocument): Promise<string> {
    try {
      // Verify it's a PDF file
      if (document.mimetype !== 'application/pdf') {
        throw new BadRequestException('Document must be a PDF file');
      }

      // Download the file from GridFS
      const downloadStream = this.gridFSBucket.openDownloadStream(document.gridFSId);
      
      // Collect the file data
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        downloadStream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        downloadStream.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            
            // Parse PDF and extract text
            const pdfData = await pdfParse(buffer);
            
            if (!pdfData.text || pdfData.text.trim().length === 0) {
              throw new BadRequestException('PDF document appears to be empty or contains no readable text');
            }

            resolve(pdfData.text);
          } catch (error) {
            reject(new BadRequestException(`Failed to extract text from PDF: ${error.message}`));
          }
        });

        downloadStream.on('error', (error) => {
          reject(new BadRequestException(`Failed to download document: ${error.message}`));
        });
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to process document: ${error.message}`);
    }
  }
} 