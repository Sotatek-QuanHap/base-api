import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocketService } from './socket.service';

@Module({
  providers: [ConfigService, SocketService],
})
export class SocketModule {}
