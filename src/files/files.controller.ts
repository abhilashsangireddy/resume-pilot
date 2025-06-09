import { Controller, Post, Get, Delete, UseGuards, UseInterceptors, UploadedFile, Body, Query, Param, Request, BadRequestException, StreamableFile, Header, Response } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from './files.service';
import { Response as ExpressResponse } from 'express';

const ALLOWED_TAGS = ['resume', 'cover-letter', 'other'];

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('tags') tags: string,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const parsedTags = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
    
    // Validate tags
    const invalidTags = parsedTags.filter(tag => !ALLOWED_TAGS.includes(tag));
    if (invalidTags.length > 0) {
      throw new BadRequestException(
        `Invalid tags: ${invalidTags.join(', ')}. Allowed tags are: ${ALLOWED_TAGS.join(', ')}`
      );
    }

    return this.filesService.uploadFile(file, req.user.userId, parsedTags);
  }

  @Get()
  async getFiles(@Request() req, @Query('tags') tags?: string) {
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : undefined;
    
    // Validate filter tags
    if (parsedTags) {
      const invalidTags = parsedTags.filter(tag => !ALLOWED_TAGS.includes(tag));
      if (invalidTags.length > 0) {
        throw new BadRequestException(
          `Invalid filter tags: ${invalidTags.join(', ')}. Allowed tags are: ${ALLOWED_TAGS.join(', ')}`
        );
      }
    }

    return this.filesService.getFilesByUser(req.user.userId, parsedTags);
  }

  @Get(':id/download')
  @Header('Content-Disposition', 'attachment')
  async downloadFile(
    @Param('id') fileId: string,
    @Request() req,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const { stream, filename, mimetype } = await this.filesService.downloadFile(
      fileId,
      req.user.userId,
    );

    res.set({
      'Content-Type': mimetype,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(stream);
  }

  @Delete(':id')
  async deleteFile(@Param('id') fileId: string, @Request() req) {
    return this.filesService.deleteFile(fileId, req.user.userId);
  }

  @Post(':id/tags')
  async updateTags(
    @Param('id') fileId: string,
    @Body('tags') tags: string[],
    @Request() req,
  ) {
    // Validate tags
    const invalidTags = tags.filter(tag => !ALLOWED_TAGS.includes(tag.toLowerCase()));
    if (invalidTags.length > 0) {
      throw new BadRequestException(
        `Invalid tags: ${invalidTags.join(', ')}. Allowed tags are: ${ALLOWED_TAGS.join(', ')}`
      );
    }

    return this.filesService.updateTags(fileId, req.user.userId, tags.map(tag => tag.toLowerCase()));
  }
} 