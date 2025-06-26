import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema()
export class Category {
  @Prop({ required: true })
  cate_name: string;

  @Prop()
  cate_cover_url: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);