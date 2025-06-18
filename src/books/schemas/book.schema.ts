import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import e from 'express';
import { Document } from 'mongoose';

export type BookDocument = Book & Document;

@Schema()
export class Book {
    @Prop({ required: true })
    book_name: string;
    
    @Prop({ required: true })
    book_author: string;

    @Prop({ required: true })
    book_description: string;

    @Prop({ required: true })
    book_cover_image_url: string;

    @Prop({ required: true })
    book_reader_url: string;

    @Prop({ required: true, default: 0 })
    book_borrow_count: number;

    
}

export const BookSchema = SchemaFactory.createForClass(Book);