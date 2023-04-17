import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/share/common/base.service';
import { PrismaService } from 'src/share/prisma/prisma.service';
import { SignKYCDTO, UserSignDTO } from './dtos/user.dto';
import { ethers } from 'ethers';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { User } from '@prisma/client';
import { CrawlerConfigService } from 'src/share/configs/config.service';

@Injectable()
export class UserService extends BaseService {
  constructor(
    prismaService: PrismaService,
    configService: ConfigService,
    private crawlerConfigService: CrawlerConfigService,
  ) {
    super(prismaService, 'user', 'User', configService);
  }

  async get(req: Request, id: any): Promise<any> {
    return super.get(req, id, {
      include: {
        proxies: true,
      },
    });
  }

  async signKyc(user: User, body: SignKYCDTO): Promise<any> {
    if (body.chainId != this.configService.get<number>('CHAIN_ID', 421613)) {
      throw new HttpException('Chain ID not support', HttpStatus.BAD_REQUEST);
    }
    const userNft = await this.prismaService.userNft.findFirst({
      where: {
        ...body,
        userId: user.id,
      },
    });

    if (userNft?.nftId) {
      throw new HttpException('Nft existed', HttpStatus.NOT_ACCEPTABLE);
    }

    if (!userNft || Number(userNft?.expiresAt) * 1000 < Date.now()) {
      const uniqueIdentityAddress = this.configService.get<string>(
        'UNIQUE_IDENTITY_ADDRESS',
        '0xCE612CdDEF74E76b5f22741F521D9bcf6e5811Ae',
      );
      const result = await this.generateSoulBoundNFT({
        account: user.address,
        identityType: 1,
        chainId: body.chainId, // 5 -  Goerli ChainID
        uniqueIdentityAddress,
        expiresAt:
          Math.floor(new Date().getTime() / 1000) +
          this.configService.get<number>('SIGN_EXPIRED', 600),
      });

      const newUserNft = await this.prismaService.userNft.upsert({
        where: {
          userId_chainId_uniqueIdentityAddress_unique: {
            chainId: body.chainId,
            uniqueIdentityAddress,
            userId: user.id,
          },
        },
        update: { ...result },
        create: {
          ...body,
          ...result,
          uniqueIdentityAddress,
          userId: user.id,
        },
      });
      return {
        ...newUserNft,
        expiresAt: Number(newUserNft.expiresAt),
        timestamp: Date.now(),
      };
    }

    return {
      ...userNft,
      expiresAt: Number(userNft.expiresAt),
      timestamp: Date.now(),
    };
  }

  async signOut(token: number): Promise<any> {
    return await this.prismaService.tokenOfUser.delete({
      where: { id: token },
    });
  }

  async signIn(data: UserSignDTO): Promise<any> {
    let address: string;
    try {
      address = ethers.utils.verifyMessage(
        `${this.configService.get<string>('APP_ID', 'helix')}#${
          data.timestamp
        }`,
        data.sign,
      );
    } catch (error) {
      // throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
      address = data.address;
    }
    if (address.toLowerCase() !== data.address.toLowerCase()) {
      throw new HttpException('sign.invalid', HttpStatus.BAD_REQUEST);
    }
    try {
      const user = await this.prismaService.user.upsert({
        where: { address: data.address.toLowerCase() },
        update: { address: data.address.toLowerCase() },
        create: { address: data.address.toLowerCase() },
      });

      const content = jwt.sign(
        { id: user.id, address: user.address },
        this.configService.get<string>('JWT_KEY', 'helix_key'),
        { expiresIn: this.configService.get<string>('JWT_EXPIRES', '1 day') },
      );
      const token = await this.prismaService.tokenOfUser.create({
        include: {
          user: true,
        },
        data: {
          userId: user.id,
          token: content,
        },
      });
      return token;
    } catch (error) {
      console.log('error at signIn', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async generateSoulBoundNFT({
    account,
    identityType,
    expiresAt,
    chainId,
    uniqueIdentityAddress,
  }: {
    identityType: number;
    account: string;
    expiresAt: number;
    chainId: number;
    uniqueIdentityAddress: string;
  }): Promise<any> {
    const rpcUrl = await this.crawlerConfigService.get(
      undefined,
      `GRPC_OF_${chainId}`,
    );

    const provider = new ethers.providers.JsonRpcProvider(
      rpcUrl.stringValue.split(',')[0],
    );
    const ADMIN_PRIVATE_KEY =
      this.configService.get<string>('ADMIN_PRIVATE_KEY');

    const signer = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

    const uniqueIdentityContract = new ethers.Contract(
      uniqueIdentityAddress,
      [
        {
          inputs: [
            {
              internalType: 'address',
              name: '',
              type: 'address',
            },
          ],
          name: 'nonces',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      signer,
    );
    const nonce = await uniqueIdentityContract.nonces(account);

    const issuingEncodedMessage = ethers.utils.solidityKeccak256(
      ['address', 'uint256', 'uint256', 'address', 'uint256', 'uint256'],
      [
        account,
        identityType, // UUID types - leave it as 0
        expiresAt, // expired at
        uniqueIdentityAddress, // Helix Unique identity contract
        nonce, // nonce
        chainId, // Goerli ChainID
      ],
    );

    console.log('Issuing message: ', issuingEncodedMessage);
    const signature = await signer.signMessage(
      ethers.utils.arrayify(issuingEncodedMessage),
    );

    console.log('Signature: ', signature);
    console.log('expiresAt: ', expiresAt);

    return { sign: signature, expiresAt };
  }
}
