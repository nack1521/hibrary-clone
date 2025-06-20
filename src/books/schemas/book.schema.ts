import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

    @Prop({
        type: [
            {
                _id: { type: Types.ObjectId, ref: 'Category' ,required: true },
                cate_name: { type: String, required: true }
            }
        ]
    })
    categories: { _id : Types.ObjectId, cate_name: string }[];
}

export const BookSchema = SchemaFactory.createForClass(Book);