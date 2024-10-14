import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Room {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [{ id: String, name: String }] })
  users: { id: string; name: string }[];

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

export type RoomDocument = Room & Document & { id: string };
export const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

RoomSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
});