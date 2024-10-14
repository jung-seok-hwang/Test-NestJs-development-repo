import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayDisconnect {
  constructor(private chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('getRooms')
  handleGetRooms(): any {
    return this.chatService.getRooms();
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @MessageBody() data: { name: string; roomName: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = this.chatService.createRoom(data.name, data.roomName, client.id);
    client.join(room.id);
    client.emit('joinedRoom', { roomId: room.id, roomName: room.name });
    this.server.emit('roomList', this.chatService.getRooms());
    this.server.to(room.id).emit('userJoined', { user: data.name, roomName: room.name });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { name: string; roomId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = this.chatService.joinRoom(data.name, data.roomId, client.id);
    if (room) {
      client.join(room.id);
      client.emit('joinedRoom', { roomId: room.id, roomName: room.name });
      this.server.to(room.id).emit('userJoined', { user: data.name, roomName: room.name });
    }
  }

  @SubscribeMessage('chatMessage')
  async handleMessage(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const result = await this.chatService.saveMessage(client.id, message);
    if (result) {
      this.server.to(result.roomId).emit('chatMessage', result);
    }
  }

  @SubscribeMessage('getChatHistory')
  async handleGetChatHistory(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const messages = await this.chatService.getChatHistory(data.roomId);
    client.emit('chatHistory', messages);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@ConnectedSocket() client: Socket): Promise<void> {
    const result = await this.chatService.leaveRoom(client.id);
    if (result) {
      this.server.to(result.roomId).emit('userLeft', { user: result.userName, roomName: result.roomName });
      client.leave(result.roomId);
      this.server.emit('roomList', this.chatService.getRooms());
    }
  }

  async handleDisconnect(client: Socket) {
    await this.handleLeaveRoom(client);
    console.log(`클라이언트 연결 해제: ${client.id}`);
  }
}