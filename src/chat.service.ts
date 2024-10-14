import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './message.schema';

interface User {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  users: User[];
}

@Injectable()
export class ChatService {
  private users: User[] = [];
  private rooms: Room[] = [];

  constructor(@InjectModel(Message.name) private messageModel: Model<MessageDocument>) {
    // 초기 사용자 두 명 추가
    this.users.push(
      { id: '1', name: '사용자1' },
      { id: '2', name: '사용자2' }
    );
  }

  getRooms(): any {
    return this.rooms.map(room => ({ id: room.id, name: room.name, users: room.users }));
  }

  createRoom(name: string, roomName: string, clientId: string): Room {
    const user: User = { id: clientId, name };
    this.users.push(user);

    const room: Room = { id: Date.now().toString(), name: roomName, users: [user] };
    this.rooms.push(room);

    return room;
  }

  joinRoom(name: string, roomId: string, clientId: string): Room | null {
    const user: User = { id: clientId, name };
    this.users.push(user);

    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      room.users.push(user);
      return room;
    }
    return null;
  }

  async saveMessage(clientId: string, message: string): Promise<any | null> {
    const user = this.users.find(u => u.id === clientId);
    const room = this.rooms.find(r => r.users.some(u => u.id === clientId));
    
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
    const room = this.rooms.find(r => r.users.some(u => u.id === clientId));
    
    if (user && room) {
      await this.saveChatHistory(room.id);

      room.users = room.users.filter(u => u.id !== clientId);
      this.users = this.users.filter(u => u.id !== clientId);
      
      if (room.users.length === 0) {
        this.rooms = this.rooms.filter(r => r.id !== room.id);
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
}
