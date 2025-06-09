import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TemplateDocument = Template & Document;

@Schema({ timestamps: true })
export class Template {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  thumbnail_image: string;

  @Prop({ required: true })
  image: string;

  @Prop({ type: Types.ObjectId, ref: 'File', required: true })
  preview_pdf_id: Types.ObjectId;

  @Prop({ required: true })
  author: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  short_description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true, length: 5 })
  template_path: string;
}

export const TemplateSchema = SchemaFactory.createForClass(Template); 