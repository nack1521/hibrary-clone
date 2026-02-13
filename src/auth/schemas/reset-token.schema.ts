import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document }  from "mongoose";

@Schema({ versionKey: false ,timestamps: true})
export class ResetToken extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  token: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const ResetTokenSchema = SchemaFactory.createForClass(ResetToken);