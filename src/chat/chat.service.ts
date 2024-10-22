import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './message.schema';
import { Room, RoomDocument } from './room.schema';

interface User {
  id: string;
  name: string;
}

@Injectable()
export class ChatService {
  private users: User[] = [];

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>
  ) {}

  async getRooms(): Promise<Room[]> {
    return this.roomModel.find({ expiresAt: { $gt: new Date() } }).exec();
  }

  async createRoom(name: string, roomName: string, clientId: string, expiresIn: number): Promise<RoomDocument> {
    const user: User = { id: clientId, name };
    this.users.push(user);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresIn);

    const room = new this.roomModel({
      name: roomName,
      users: [user],
      createdAt: new Date(),
      expiresAt: expiresAt,
    });

    return room.save();
  }

  async joinRoom(name: string, roomId: string, clientId: string): Promise<RoomDocument | null> {
    const user: User = { id: clientId, name };
    this.users.push(user);

    const room = await this.roomModel.findById(roomId);
    if (room) {
      room.users.push(user);
      return room.save();
    }
    return null;
  }

  async saveMessage(clientId: string, message: string): Promise<any | null> {
    const user = this.users.find(u => u.id === clientId);
    const room = await this.roomModel.findOne({ 'users.id': clientId });
    
    if (user && room) {
      const timestamp = new Date();
      const newMessage = new this.messageModel({
        roomId: room.id,
        userName: user.name,
        message: message,
        timestamp: timestamp,
      });
      await newMessage.save();

      return {
        message,
        userName: user.name,
        roomName: room.name,
        roomId: room.id,
        timestamp: timestamp.toISOString(),
      };
    }
    return null;
  }

  async getChatHistory(roomId: string): Promise<Message[]> {
    return this.messageModel.find({ roomId }).sort({ timestamp: 1 });
  }

  async leaveRoom(clientId: string): Promise<{ roomId: string; userName: string; roomName: string } | null> {
    const user = this.users.find(u => u.id === clientId);
    const room = await this.roomModel.findOne({ 'users.id': clientId });
    
    if (user && room) {
      await this.saveChatHistory(room.id);

      room.users = room.users.filter(u => u.id !== clientId);
      await room.save();

      this.users = this.users.filter(u => u.id !== clientId);
      
      if (room.users.length === 0) {
        await this.roomModel.findByIdAndDelete(room.id);
      }

      return {
        roomId: room.id,
        userName: user.name,
        roomName: room.name
      };
    }

    return null;
  }

  private async saveChatHistory(roomId: string): Promise<void> {
    try {
      const messages = await this.messageModel.find({ roomId }).sort({ timestamp: 1 });
      
      console.log(`Saving chat history for room ${roomId}:`);
      messages.forEach(msg => {
        console.log(`[${msg.timestamp}] ${msg.userName}: ${msg.message}`);
      });

      // 여기서 채팅 기록을 파일이나 다른 데이터베이스에 저장하는 로직을 추가할 수 있습니다.

      // await this.messageModel.deleteMany({ roomId });
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  async cleanExpiredRooms(): Promise<void> {
    await this.roomModel.deleteMany({ expiresAt: { $lte: new Date() } });
  }
}