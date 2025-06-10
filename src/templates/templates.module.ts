import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TemplatesSeedService } from './templates-seed.service';
import { Template, TemplateSchema } from './template.schema';
import { File, FileSchema } from '../files/file.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Template.name, schema: TemplateSchema },
      { name: File.name, schema: FileSchema },
    ]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplatesSeedService],
  exports: [TemplatesService],
})
export class TemplatesModule implements OnModuleInit {
  constructor(private readonly templatesSeedService: TemplatesSeedService) {}

  async onModuleInit() {
    await this.templatesSeedService.seedTemplates();
  }
}