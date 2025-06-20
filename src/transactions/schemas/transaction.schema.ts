import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type TransactionDocument = Transaction & Document;


@Schema()
export class Transaction {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
    bookId: Types.ObjectId;

    @Prop({ type: Date, default: Date.now })
    startTime: Date;

    @Prop({ type: String, required: true, unique: true })
    token: string;

    @Prop({ type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
    expiresAt: Date;

    @Prop({ type: Boolean, default: true })
    isActive: boolean;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);