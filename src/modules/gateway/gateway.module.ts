import { Module } from '@nestjs/common';
import { UserModule } from './users/user.module';
import { SocketService } from 'src/share/socket/socket.service';
@Module({
  imports: [UserModule],
  controllers: [],
  providers: [],
})
export class GatewayModule {
  constructor() {
    setTimeout(this.demoSendSocket, 10000);
  }

  demoSendSocket() {
    SocketService.emit(['dashboard'], 'events', {
      message: 'hello at ' + Date.now(),
    });
  }
}
