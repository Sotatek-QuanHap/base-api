import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VerifyAdminMiddleware } from './middlwares/verify-admin.middlewre';
import { CrawlerConfigModule } from './share/configs/config.module';
import { RabbitMQModule } from './rabbitmq/rabbit.module';
import { PrismaModule } from './share/prisma/prisma.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { SocketModule } from './share/socket/socket.module';
import { CronjobModule } from './modules/cronjob/cronjob.module';

@Module({
  imports: [
    PrismaModule,
    CrawlerConfigModule,
    RabbitMQModule,
    GatewayModule,
    SocketModule,
    CronjobModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(VerifyAdminMiddleware).forRoutes('*');
  }
}
