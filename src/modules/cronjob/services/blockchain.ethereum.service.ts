import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Store } from 'src/rabbitmq/store';
import { BlockchainBaseService } from 'src/share/blockchain/base.service';
import { CrawlerConfigService } from 'src/share/configs/config.service';
import { PrismaService } from 'src/share/prisma/prisma.service';
import { TimeUtils } from 'src/share/utils/time.utils';

@Injectable()
export class BlockchainEthereumService extends BlockchainBaseService {
  constructor(
    crawlerConfigService: CrawlerConfigService,
    prisma: PrismaService,
    configService: ConfigService,
  ) {
    super(crawlerConfigService, prisma, configService);
    this.chain = 'ethereum';
  }

  async run() {
    if (this.configService.get('ENV') == 'development') {
      return;
    }
    while (true) {
      try {
        const latestNumber = (await this.getLastNumber()) - 3;
        const numberDefault = this.configService.get<number>(
          `last_number_of_${this.chain}`,
          8507200,
        );
        let lastNumberDB = await this.prisma.crawlerConfig.upsert({
          where: {
            key_order_unique: { key: `last_number_of_${this.chain}`, order: 0 },
          },
          update: {},
          create: {
            key: `last_number_of_${this.chain}`,
            order: 0,
            numberValue: numberDefault,
          },
        });
        const queueName = this.configService.get(
          `QUEUE_REQUEST_BLOCK_OF_${this.chain}`.toUpperCase(),
          `request-block-${this.chain}`,
        );
        while (lastNumberDB.numberValue < latestNumber) {
          await Store.sendToQueue(
            queueName,
            Buffer.from(
              JSON.stringify({ blockNumber: lastNumberDB.numberValue }),
            ),
            this.configService,
          );
          lastNumberDB = await this.prisma.crawlerConfig.update({
            where: { id: lastNumberDB.id },
            data: { numberValue: { increment: 1 } },
          });
        }
      } catch (error) {
        console.log('push to crawler error: ', error);
      }
      await TimeUtils.sleepRandom();
    }
  }
}
