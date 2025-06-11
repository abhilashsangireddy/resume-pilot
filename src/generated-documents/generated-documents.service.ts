import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { GeneratedDocument, GeneratedDocumentDocument } from './generated-document.schema';
import { GridFSBucket } from 'mongodb';

@Injectable()
export class GeneratedDocumentsService {
  private gridFSBucket: GridFSBucket;

  constructor(
    @InjectModel(GeneratedDocument.name) private generatedDocumentModel: Model<GeneratedDocumentDocument>,
    @InjectConnection() private connection: Connection,
  ) {
    if (!this.connection.db) {
      throw new Error('Database connection not established');
    }
    this.gridFSBucket = new GridFSBucket(this.connection.db);
  }

  async findAllByUser(userId: string, search?: string): Promise<GeneratedDocumentDocument[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    return this.generatedDocumentModel
      .find(query)
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<GeneratedDocumentDocument> {
    const document = await this.generatedDocumentModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });

    if (!document) {
      throw new NotFoundException('Generated document not found');
    }

    return document;
  }

  async create(createData: {
    mainTexId: Types.ObjectId;
    mainClsId: Types.ObjectId;
    name: string;
    pdfFileId: Types.ObjectId;
    userId: string;
    version?: number;
  }): Promise<GeneratedDocumentDocument> {
    const generatedDocument = new this.generatedDocumentModel({
      ...createData,
      userId: new Types.ObjectId(createData.userId),
    });

    return generatedDocument.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const document = await this.findOne(id, userId);

    try {
      // Delete all associated GridFS files
      await Promise.all([
        this.deleteGridFSFile(document.mainTexId),
        this.deleteGridFSFile(document.mainClsId),
        this.deleteGridFSFile(document.pdfFileId),
      ]);

      // Delete the document record
      await this.generatedDocumentModel.deleteOne({ _id: id });
    } catch (error) {
      throw new BadRequestException(`Failed to delete generated document: ${error.message}`);
    }
  }

  async getDocumentStream(fileId: Types.ObjectId) {
    try {
      return this.gridFSBucket.openDownloadStream(fileId);
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }

  private async deleteGridFSFile(fileId: Types.ObjectId): Promise<void> {
    try {
      await this.gridFSBucket.delete(fileId);
    } catch (error) {
      // Log error but don't throw - file might already be deleted
      console.warn(`Failed to delete GridFS file ${fileId}:`, error.message);
    }
  }
} 