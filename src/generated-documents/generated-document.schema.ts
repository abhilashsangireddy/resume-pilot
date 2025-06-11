import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/user.schema';

export type GeneratedDocumentDocument = GeneratedDocument & Document;

@Schema({ timestamps: true })
export class GeneratedDocument {
  @Prop({ required: true })
  mainTexId: Types.ObjectId;

  @Prop({ required: true })
  mainClsId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  pdfFileId: Types.ObjectId;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const GeneratedDocumentSchema = SchemaFactory.createForClass(GeneratedDocument); 