import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseHandle } from 'src/rabbitmq/BaseHandle';
import { PrismaService } from 'src/share/prisma/prisma.service';
import { SocketService } from 'src/share/socket/socket.service';

@Injectable()
export class MintNftHandle extends BaseHandle {
  constructor(
    configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    super(configService);

    this.queueName = this.configService.get<string>(
      'queue_transfer_single'.toLowerCase(),
      'transfer-single',
    );
  }

  async process(message: any): Promise<void> {
    let user = await this.prismaService.user.findFirst({
      where: { address: message.to },
    });
    if (!user) {
      throw { message: 'cannot find user' };
    }

    const userNft = await this.prismaService.userNft.update({
      where: {
        userId_chainId_uniqueIdentityAddress_unique: {
          userId: user.id,
          chainId: message.chainId,
          uniqueIdentityAddress: message.address,
        },
      },
      data: {
        nftId: +message.id,
      },
    });
    if (!userNft) {
      throw { message: 'cannot find user kyc nft' };
    }

    user = await this.prismaService.user.update({
      where: { id: user.id },
      data: { status: 2 },
    });
    SocketService.emit([`mint_${user.id}`], `events`, { status: user.status });
  }
}
