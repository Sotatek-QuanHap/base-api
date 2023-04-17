import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CrawlerConfigService } from './config.service';
import { Request } from 'express';

@Controller('configs')
@ApiTags('configs')
export class CrawlerConfigController {
  constructor(private crawlerConfigService: CrawlerConfigService) {}

  @Get('/')
  @ApiOperation({ summary: `Get detail config` })
  async getAll(@Req() req: Request): Promise<any> {
    return this.crawlerConfigService.getAll(req);
  }

  @Get('/:id')
  @ApiOperation({ summary: `Get detail config` })
  async detail(@Req() req: Request, @Param('id') id: any): Promise<any> {
    console.log('detail of controller', id);
    return this.crawlerConfigService.get(req, id);
  }

  @Post('/reset/:key')
  @ApiOperation({ summary: `Request reset config` })
  async requestReset(
    @Param('key') id: string,
    @Body() body: any,
  ): Promise<any> {
    const data = await this.crawlerConfigService.requestReset({
      id,
      data: body,
    });
    return { data };
  }

  @Get('/ping/:key/:instance')
  @ApiOperation({ summary: `Ping config by key` })
  async ping(
    @Param('key') id: string,
    @Param('key') instance: string,
  ): Promise<any> {
    const data = await this.crawlerConfigService.ping({ id, instance });
    return { data };
  }
}
