import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface User {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  users: User[];
}

@WebSocketGateway({ path: '/ws-stomp', cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private users: User[] = [];
  private rooms: Room[] = [];

  @SubscribeMessage('getRooms')
  handleGetRooms(): Room[] {
    return this.rooms.map(room => ({ id: room.id, name: room.name, users: room.users }));
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @MessageBody() data: { name: string; roomName: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const user: User = { id: client.id, name: data.name };
    this.users.push(user);

    const room: Room = { id: Date.now().toString(), name: data.roomName, users: [user] };
    this.rooms.push(room);

    client.join(room.id);
    client.emit('joinedRoom', { roomId: room.id, roomName: room.name });
    this.server.emit('roomList', this.handleGetRooms());
    this.server.to(room.id).emit('userJoined', { user: user.name, roomName: room.name });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { name: string; roomId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const user: User = { id: client.id, name: data.name };
    this.users.push(user);

    const room = this.rooms.find(r => r.id === data.roomId);
    if (room) {
      room.users.push(user);
      client.join(room.id);
      client.emit('joinedRoom', { roomId: room.id, roomName: room.name });
      this.server.to(room.id).emit('userJoined', { user: user.name, roomName: room.name });
    }
  }

  @SubscribeMessage('chatMessage')
  handleMessage(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ): void {
    const user = this.users.find(u => u.id === client.id);
    const room = this.rooms.find(r => r.users.some(u => u.id === client.id));
    
    if (user && room) {
      this.server.to(room.id).emit('chatMessage', {
        message,
        userName: user.name,
        roomName: room.name,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket): void {
    const user = this.users.find(u => u.id === client.id);
    const room = this.rooms.find(r => r.users.some(u => u.id === client.id));
    
    if (user && room) {
      room.users = room.users.filter(u => u.id !== client.id);
      this.server.to(room.id).emit('userLeft', { user: user.name, roomName: room.name });
      client.leave(room.id);
      this.users = this.users.filter(u => u.id !== client.id);
      
      if (room.users.length === 0) {
        this.rooms = this.rooms.filter(r => r.id !== room.id);
      }
      
      this.server.emit('roomList', this.handleGetRooms());
    }
  }

  handleDisconnect(client: Socket) {
    this.handleLeaveRoom(client);
    console.log(`클라이언트 연결 해제: ${client.id}`);
  }
}