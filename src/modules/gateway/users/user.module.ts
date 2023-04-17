import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CrawlerConfigService } from 'src/share/configs/config.service';
import { MintNftHandle } from './mint-nft.handle';
import { UserController } from './user.controller';
import { UserService } from './user.service';
@Module({
  controllers: [UserController],
  providers: [ConfigService, CrawlerConfigService, UserService, MintNftHandle],
})
export class UserModule {
  constructor(private mintNftHandle: MintNftHandle) {
    this.mintNftHandle.listen();
  }
}
