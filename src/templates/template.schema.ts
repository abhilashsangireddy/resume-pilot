import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TemplateDocument = Template & Document;

@Schema({ timestamps: true })
export class Template {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'File', required: true })
  thumbnail_image_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'File', required: true })
  preview_pdf_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'File', required: true })
  main_tex_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'File', required: false })
  main_cls_id?: Types.ObjectId;

  @Prop({ required: true })
  author: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  short_description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true })
  version: string;

  @Prop({ default: true })
  is_active: boolean;
}

export const TemplateSchema = SchemaFactory.createForClass(Template); 