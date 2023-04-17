import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CrawlerConfigController } from './config.controller';
import { CrawlerConfigService } from './config.service';

@Module({
  imports: [],
  controllers: [CrawlerConfigController],
  providers: [CrawlerConfigService, ConfigService],
  exports: [CrawlerConfigService],
})
export class CrawlerConfigModule {}
