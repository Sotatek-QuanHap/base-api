import { Module } from '@nestjs/common';
import { Store } from './store';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/share/prisma/prisma.service';
import { CrawlerConfigService } from 'src/share/configs/config.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ConfigService, PrismaService, CrawlerConfigService],
})
export class RabbitMQModule {
  constructor(private readonly configService: ConfigService) {
    console.log('rabbit mq module');
    this.init();
  }

  async init() {
    await Store.initRabbitMQ(this.configService);
  }
}
