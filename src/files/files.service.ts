import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { File, FileDocument } from './file.schema';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

@Injectable()
export class FilesService {
  private gridFSBucket: GridFSBucket;

  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @InjectConnection() private connection: Connection,
  ) {
    if (!this.connection.db) {
      throw new Error('Database connection not established');
    }
    this.gridFSBucket = new GridFSBucket(this.connection.db);
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    tags: string[],
  ): Promise<File> {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Upload file to GridFS
    const uploadStream = this.gridFSBucket.openUploadStream(file.originalname);
    const fileBuffer = file.buffer;
    const readableStream = Readable.from(fileBuffer);
    await new Promise((resolve, reject) => {
      readableStream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    // Create file document
    const fileDoc = new this.fileModel({
      originalName: file.originalname,
      gridFSId: uploadStream.id,
      mimetype: file.mimetype,
      size: file.size,
      tags: tags,
      userId: new Types.ObjectId(userId),
    });

    return fileDoc.save();
  }

  async getFilesByUser(userId: string, tags?: string[]): Promise<File[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (tags && tags.length > 0) {
      query.tags = { $all: tags };
    }
    return this.fileModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async downloadFile(fileId: string, userId: string): Promise<{
    stream: Readable;
    filename: string;
    mimetype: string;
  }> {
    const file = await this.fileModel.findOne({
      _id: fileId,
      userId: new Types.ObjectId(userId),
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const downloadStream = this.gridFSBucket.openDownloadStream(file.gridFSId);
    
    return {
      stream: downloadStream,
      filename: file.originalName,
      mimetype: file.mimetype,
    };
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.fileModel.findOne({
      _id: fileId,
      userId: new Types.ObjectId(userId),
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete from GridFS
    await this.gridFSBucket.delete(file.gridFSId);

    // Delete database record
    await this.fileModel.deleteOne({ _id: fileId });
  }

  async updateTags(fileId: string, userId: string, tags: string[]): Promise<File> {
    const file = await this.fileModel.findOneAndUpdate(
      { _id: fileId, userId: new Types.ObjectId(userId) },
      { $set: { tags } },
      { new: true },
    );

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }
} 