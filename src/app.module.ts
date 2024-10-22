import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AwsS3Module } from './aws/aws-s3.module';
import { ChatGateway } from './chat/chat.gateway';
import { ChatService } from './chat/chat.service';
import { Message, MessageSchema } from './chat/message.schema';
import { Room, RoomSchema } from './chat/room.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot('mongodb://localhost:27017/chat-db'),
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
    AwsS3Module,
  ],
  controllers: [AppController],
  providers: [ChatGateway, ChatService],
})
export class AppModule {}