import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { File, FileSchema } from '../files/file.schema';
import { Template, TemplateSchema } from '../templates/template.schema';
import { GeneratedDocument, GeneratedDocumentSchema } from '../generated-documents/generated-document.schema';
import { ChatGptService } from '../services/chatgpt.service';
import { LatexService } from '../services/latex.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: GeneratedDocument.name, schema: GeneratedDocumentSchema },
    ]),
  ],
  controllers: [ResumeController],
  providers: [ResumeService, ChatGptService, LatexService],
  exports: [ResumeService],
})
export class ResumeModule {} 