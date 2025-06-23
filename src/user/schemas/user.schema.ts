import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

export interface BorrowedBook {
  token: string;
  bookId: Types.ObjectId;
  dateCreated: Date;
}

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  surname: string;

  @Prop({ type: [String], default: ['user'] })
  roles: string[]

  @Prop({
    type: [{
      token: { type: String, required: true },
      bookId: { type: Types.ObjectId, ref: 'Book', required: true },
      dateCreated: { type: Date, default: Date.now }
    }],
    default: []
  })
  books: BorrowedBook[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});