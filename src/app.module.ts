import { Module } from '@nestjs/common';
import { AppController } from './app.controller';  // 이 줄을 추가하세요
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [],
  controllers: [AppController],  // AppController를 여기에 추가하세요
  providers: [ChatGateway],
})
export class AppModule {}