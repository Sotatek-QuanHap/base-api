import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
  WebSocketGateway,
  SubscribeMessage,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketService
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(this.constructor.name);
  private static io: Server;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}
  afterInit(server: any) {
    SocketService.io = server;
  }

  static emit(rooms: string[], topic: string, data: any): void {
    if (SocketService.io) SocketService.io.to(rooms).emit(topic, data);
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`, args);
    const accessToken = client.handshake?.headers?.authorization;
    if (!accessToken) {
      client.disconnect();
      return;
    }

    try {
      const decodeToken = jwt.verify(
        accessToken,
        this.configService.get<string>('JWT_KEY', 'helix_key'),
      ) as any;
      const token = await this.prismaService.tokenOfUser.findUnique({
        where: { token: accessToken },
        include: { user: true },
      });
      if (!token) {
        client.disconnect();
        return;
      }

      if (decodeToken.id != token.userId) {
        client.disconnect();
        return;
      }
    } catch (error) {
      console.log('error at socket jwt: ', error, accessToken);
      try {
        client.emit('events', {
          message: 'Has error at authentication',
          error: error,
        });
      } catch (error) {}
      client.disconnect();
      return;
    }
    console.log('connected');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(client: Socket, room: string) {
    await client.join(room);
    this.logger.log('join room: ', room);
    setTimeout(function () {
      SocketService.emit([room], 'events', {
        message: 'hello at ' + Date.now(),
      });
    }, 5000);

    return room;
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(client: Socket, room: string) {
    await client.leave(room);
    this.logger.log('leave room: ', room);
    return room;
  }
}
