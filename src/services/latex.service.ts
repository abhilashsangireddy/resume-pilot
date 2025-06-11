import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Types, Model } from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { File, FileDocument } from '../files/file.schema';
import latex = require('node-latex');
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LatexService {
  private gridFSBucket: GridFSBucket;

  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(File.name) private fileModel: Model<FileDocument>
  ) {
    if (!this.connection.db) {
      throw new Error('Database connection not established');
    }
    this.gridFSBucket = new GridFSBucket(this.connection.db);
  }

  async compileLatexToPdf(
    texContent: string,
    clsContent?: string,
    clsFileName?: string,
  ): Promise<Buffer> {
    const tempDir = path.join(os.tmpdir(), `latex-${uuidv4()}`);
    
    try {
      // Create temporary directory
      await fs.promises.mkdir(tempDir, { recursive: true });

      // Write .tex file
      const texPath = path.join(tempDir, 'document.tex');
      await fs.promises.writeFile(texPath, texContent, 'utf8');

      // Write .cls file if provided
      if (clsContent && clsFileName) {
        const clsPath = path.join(tempDir, clsFileName);
        await fs.promises.writeFile(clsPath, clsContent, 'utf8');
      }

      // Compile LaTeX to PDF
      const pdfBuffer = await this.compileTex(texPath, tempDir);
      
      return pdfBuffer;
    } catch (error) {
      throw new BadRequestException(`LaTeX compilation failed: ${error.message}`);
    } finally {
      // Clean up temporary directory
      try {
        await this.cleanupDirectory(tempDir);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary directory:', cleanupError);
      }
    }
  }

  async getTemplateFiles(mainTexId: string, mainClsId?: string): Promise<{
    texContent: string;
    clsContent?: string;
    clsFileName?: string;
  }> {
    
    try {
      // Step 1: Get .tex file record from Files collection
      const texFileRecord = await this.fileModel.findById(mainTexId);
      if (!texFileRecord) {
        console.error(`[LatexService] .tex file record not found in Files collection with ID: ${mainTexId}`);
        throw new BadRequestException(`Template .tex file record not found with ID: ${mainTexId}`);
      }

      // Step 2: Download .tex file content from GridFS using gridFSId
      const texContent = await this.downloadGridFSFile(texFileRecord.gridFSId.toString());
      
      let clsContent: string | undefined;
      let clsFileName: string | undefined;
      
      // Step 3: Get .cls file if provided
      if (mainClsId) {
        const clsFileRecord = await this.fileModel.findById(mainClsId);
        if (!clsFileRecord) {
          throw new BadRequestException(`Template .cls file record not found with ID: ${mainClsId}`);
        }

        clsContent = await this.downloadGridFSFile(clsFileRecord.gridFSId.toString());
        clsFileName = clsFileRecord.originalName;
      }

      return {
        texContent,
        clsContent,
        clsFileName,
      };
    } catch (error) {
      console.error(`[LatexService] Error retrieving template files:`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve template files: ${error.message}`);
    }
  }

  private async downloadGridFSFile(fileId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const downloadStream = this.gridFSBucket.openDownloadStream(new Types.ObjectId(fileId));
      const chunks: Buffer[] = [];

      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on('end', () => {
        const content = Buffer.concat(chunks).toString('utf8');
        resolve(content);
      });

      downloadStream.on('error', (error) => {
        reject(new BadRequestException(`Failed to download file: ${error.message}`));
      });
    });
  }

  private async compileTex(texPath: string, workingDir: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const input = fs.createReadStream(texPath);
      const chunks: Buffer[] = [];

      const latexOptions = {
        inputs: workingDir,
        passes: 2, // Run LaTeX twice for references
        errorLogs: true,
      };

      const pdf = (latex as any)(input, latexOptions);

      pdf.on('data', (chunk) => {
        chunks.push(chunk);
      });

      pdf.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      pdf.on('error', (error) => {
        reject(new Error(`LaTeX compilation error: ${error.message}`));
      });
    });
  }

  private async cleanupDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.promises.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.promises.stat(filePath);
        
        if (stat.isDirectory()) {
          await this.cleanupDirectory(filePath);
        } else {
          await fs.promises.unlink(filePath);
        }
      }
      
      await fs.promises.rmdir(dirPath);
    } catch (error) {
      console.warn(`Failed to cleanup directory ${dirPath}:`, error);
    }
  }
} 