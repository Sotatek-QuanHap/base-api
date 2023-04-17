import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Store } from 'src/rabbitmq/store';
import { BaseService } from 'src/share/common/base.service';
import { PrismaService } from 'src/share/prisma/prisma.service';
import { ConfigCreateDTO } from './config.dto';
import { Request } from 'express';
import { CrawlerConfig } from '@prisma/client';
@Injectable()
export class CrawlerConfigService extends BaseService {
  constructor(prismaService: PrismaService, configService: ConfigService) {
    super(prismaService, 'crawlerConfig', 'CrawlerConfig', configService);
  }

  async requestReset(body: { id: string; data: any }): Promise<any> {
    const { id, data } = body;
    Store.publishToQueue(
      this.configService.get('CONFIG_UPDATED', 'config-updated'),
      Buffer.from(JSON.stringify({ ...data, type: id, cmd: 'reload' })),
      this.configService,
    );
    return 'ok';
  }

  async create(data: ConfigCreateDTO): Promise<any> {
    const rs = [];
    data.numberRecords = data.numberRecords || 1;
    if (data.isMulti) {
      rs.push(
        await this.prismaService.crawlerConfig.upsert({
          where: { key_order_unique: { key: data.key, order: 0 } },
          update: {
            isMulti: true,
            order: 0,
            stringValue: data.stringValue,
            numberValue: data.numberValue,
          },
          create: {
            key: data.key,
            order: 0,
            isMulti: true,
            stringValue: data.stringValue,
            numberValue: data.numberValue,
          },
        }),
      );
    } else
      for (let index = 0; index < data.numberRecords; index++) {
        rs.push(
          await this.prismaService.crawlerConfig.upsert({
            where: { key_order_unique: { key: data.key, order: index } },
            update: {
              order: 0,
              isMulti: false,
              stringValue: data.stringValue,
              numberValue: data.numberValue,
            },
            create: {
              key: data.key,
              order: index,
              isMulti: false,
              stringValue: data.stringValue,
              numberValue: data.numberValue,
            },
          }),
        );
      }
    await this.prismaService.crawlerConfig.deleteMany({
      where: { key: data.key, order: { gt: rs.length } },
    });
    return rs;
  }

  async get(req: Request, id: any): Promise<CrawlerConfig> {
    let rs = await this.prismaService.crawlerConfig.findFirst({
      where: { key: id },
    });
    // console.log('get detail: ', req.query, rs, id.toUpperCase(), this.configService.get(id.toUpperCase()));
    if (!rs && this.configService.get(id.toUpperCase())) {
      const data = {
        key: id,
      } as any;
      let value = this.configService.get(id.toUpperCase()) as string;
      const groups = value.trim().match(/^\(([^\)]*)\)/);
      let numberRecords = 1;
      let isMulti = true;
      if (groups) {
        for (const prop of groups[1].split(',')) {
          const parts = prop.split('=');
          if (parts[0] == 'isMulti') {
            isMulti = parts[1].toLowerCase() != 'false';
            continue;
          }
          if (parts[0] == 'numberRecords') {
            numberRecords = isNaN(+parts[1]) ? 1 : +parts[1];
            continue;
          }
        }
        value = value.replace(groups[0], '');
      }
      data.numberRecords = numberRecords;
      data.isMulti = isMulti;
      const elements = value.split('~');
      for (const element of elements) {
        const index = element.indexOf(':');
        data[element.substring(0, index)] = element.substring(index + 1);
      }
      console.log('data: ', data);
      const reords = await this.create(data);
      rs = reords[0];
    }

    if (!rs) {
      return null;
    }
    if (rs.isMulti) return rs;

    if (!req) return rs;

    const instanceId = req.header['instanceId'];

    rs = await this.prismaService.crawlerConfig.findFirst({
      where: {
        OR: [
          { key: id, instanceId },
          { key: id, instanceId: null },
          { key: id, lastPing: { lt: new Date(Date.now() - 10000) } },
        ],
      },
    });
    if (rs)
      return await this.prismaService.crawlerConfig.update({
        where: { id: rs.id },
        data: { instanceId, lastPing: new Date() },
      });
    return null;
  }

  async ping({ id, instance }: { id: string; instance: string }): Promise<any> {
    const rs = await this.prismaService.crawlerConfig.findFirst({
      where: { key: id, instanceId: instance },
    });
    console.log('ping rs: ', rs, id, instance);
    if (rs)
      return await this.prismaService.crawlerConfig.update({
        where: { id: rs.id },
        data: { lastPing: new Date() },
      });
    return null;
  }
}
