import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GeneratedDocumentsController } from './generated-documents.controller';
import { GeneratedDocumentsService } from './generated-documents.service';
import { GeneratedDocument, GeneratedDocumentSchema } from './generated-document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeneratedDocument.name, schema: GeneratedDocumentSchema },
    ]),
  ],
  controllers: [GeneratedDocumentsController],
  providers: [GeneratedDocumentsService],
  exports: [GeneratedDocumentsService],
})
export class GeneratedDocumentsModule {} 