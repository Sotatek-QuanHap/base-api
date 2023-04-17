import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';
import { Prisma } from '@prisma/client';

export class BaseService {
  protected prismaService: PrismaService;
  protected entityModel: string;
  protected fields: Map<string, Prisma.DMMF.Field>;
  protected configService: ConfigService;
  constructor(
    prismaService: PrismaService,
    entityModel: string,
    modelName: string,
    configService: ConfigService,
  ) {
    this.prismaService = prismaService;
    this.entityModel = entityModel;
    this.configService = configService;
    const tempFields =
      Prisma.dmmf.datamodel.models.find((model) => model.name == modelName)
        .fields || [];
    this.fields = new Map<string, Prisma.DMMF.Field>();
    for (const field of tempFields) {
      this.fields[field.name] = field;
    }
  }

  async getAll(req: Request, other: any = {}): Promise<any> {
    const params = this.exportParams(req);
    console.log('data: ', JSON.stringify(params));
    const { query, select, skip, take, sorts } = params;
    const data = await this.prismaService[this.entityModel].findMany({
      where: query,
      select,
      orderBy: sorts,
      skip,
      take,
      ...other,
    });
    const meta = await this.buildMetaData(take, query);
    return { meta, data };
  }

  async create(data: any, other: any = {}): Promise<any> {
    try {
      return await this.prismaService[this.entityModel].create({
        data,
        ...other,
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async get(req: Request, id: any, other: any = {}): Promise<any> {
    const rs = await this.prismaService[this.entityModel].findFirst({
      where: { ...req.query, id: +id },
      ...other,
    });
    if (rs) return rs;
    throw new HttpException('Cannot find', HttpStatus.NOT_FOUND);
  }

  async update(
    query: any = {},
    id: any,
    data: any,
    other: any = {},
  ): Promise<any> {
    console.log('query: ', query);
    const rs = await this.prismaService[this.entityModel].updateMany({
      where: { ...query, id: +id },
      data,
      ...other,
    });
    if (rs.count)
      return await this.prismaService[this.entityModel].findFirst({
        where: { id: +id },
        ...other,
      });
    throw new HttpException('Cannot update', HttpStatus.NOT_FOUND);
  }

  async remove(req: Request, id: any, other: any = {}): Promise<any> {
    return await this.prismaService[this.entityModel].deleteMany({
      where: { ...req.query, id: +id },
      ...other,
    });
  }

  async buildMetaData(size: number, query: any): Promise<any> {
    const count = await this.prismaService[this.entityModel].count({
      where: query,
    });
    return {
      count,
      totalPages: size > 0 ? Math.ceil(count / size) : 1,
    };
  }

  async upsert(
    query: any = {},
    create: any,
    update: any = {},
    other: any = {},
  ): Promise<any> {
    try {
      return await this.prismaService[this.entityModel].upsert({
        where: query,
        update: update,
        create: create,
        ...other,
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  exportParams(req: Request): any {
    const params = req.query;
    let page = 0;
    let size = this.configService.get<number>('PERPAGE_DEFAULT', 20);
    let sorts = { id: 'desc' } as any;
    const select = undefined;
    if (params['fields']) {
      const fields = params['fields'] as string;
      for (const field of fields.split(',')) {
        select[field] = field;
      }
      delete params['fields'];
    }
    if ((params.page == '0' || params.page) && !isNaN(+params?.page)) {
      page = Math.max(0, +params.page);
      delete params['page'];
    }
    if (params.size && !isNaN(+params?.size)) {
      size = +params.size;
      delete params['size'];
    }

    if (params['sort_by']) {
      sorts = {} as any;
      let key = params.sort_by as string;
      const orderBy = (params?.order_by || '') as string;
      if (!this.fields[key]) {
        key = 'id';
      }
      sorts[key] = orderBy.toLowerCase() == 'desc' ? 'desc' : 'asc';
      delete params['sort_by'];
      delete params['order_by'];
    }

    const query = {} as any;
    for (const key in params) {
      if (!params[key] && params[key] != '0') {
        continue;
      }
      if (this.fields[key]) {
        if (
          ['Int', 'BigInt', 'Float', 'Decimal'].includes(this.fields[key].type)
        ) {
          query[key] = +params[key];
        } else {
          query[key] = params[key];
        }

        continue;
      }
      if (key.endsWith('_gte') && !isNaN(+params[key])) {
        const attr = key.replace('_gte', '');
        if (!this.fields[attr]) {
          continue;
        }
        if (this.fields[attr].type == 'String') {
          continue;
        }
        const type = typeof query[attr];
        if ((query[attr] || query[attr] == '0') && type != 'object') {
          continue;
        }

        query[attr] = { ...query[attr], gte: +params[key] };

        continue;
      }
      if (key.endsWith('_lte') && !isNaN(+params[key])) {
        const attr = key.replace('_lte', '');
        if (!this.fields[attr]) {
          continue;
        }
        if (this.fields[attr].type == 'String') {
          continue;
        }
        const type = typeof query[attr];
        if ((query[attr] || query[attr] == 0) && type != 'object') {
          continue;
        }
        query[attr] = { ...query[attr], lte: +params[key] };
        continue;
      }
      if (key.endsWith('_gt') && !isNaN(+params[key])) {
        const attr = key.replace('_gt', '');
        if (!this.fields[attr]) {
          continue;
        }
        if (this.fields[attr].type == 'String') {
          continue;
        }
        const type = typeof query[attr];
        if ((query[attr] || query[attr] == 0) && type != 'object') {
          continue;
        }
        query[attr] = { ...query[attr], gt: +params[key] };
        continue;
      }
      if (key.endsWith('_lt') && !isNaN(+params[key])) {
        const attr = key.replace('_lt', '');
        if (!this.fields[attr]) {
          continue;
        }
        if (this.fields[attr].type == 'String') {
          continue;
        }
        const type = typeof query[attr];
        if ((query[attr] || query[attr] == 0) && type != 'object') {
          continue;
        }
        query[attr] = { ...query[attr], lt: +params[key] };
        continue;
      }

      if (key.endsWith('_in')) {
        const attr = key.replace('_in', '');
        if (!this.fields[attr]) {
          continue;
        }
        const type = typeof query[attr];
        if ((query[attr] || query[attr] == 0) && type != 'object') {
          continue;
        }
        let values = ((params[key] as string) || '')
          .split(',')
          .filter((item: string) => item.trim().length > 0) as any;
        if (
          ['Int', 'BigInt', 'Float', 'Decimal'].includes(this.fields[attr].type)
        ) {
          values = values.map((item: string) => +item.trim());
        } else {
          values = values.map((item: string) => item.trim());
        }
        query[attr] = { in: values };
        continue;
      }
      if (key.endsWith('_like')) {
        const attr = key.replace('_like', '');
        if (!this.fields[attr]) {
          continue;
        }
        const type = typeof query[attr];
        if (query[attr] && type != 'object') {
          continue;
        }
        query[attr] = { contains: query[key] };
        continue;
      }
    }
    const skip = Math.max(Math.max(page - 1, 0) * size, 0);
    return { query, select, skip, take: size > 0 ? size : undefined, sorts };
  }
}
