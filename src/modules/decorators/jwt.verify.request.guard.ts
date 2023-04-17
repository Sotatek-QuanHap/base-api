import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/share/prisma/prisma.service';

@Injectable()
export class JwtVerifyRequestGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const accessToken = (req.headers?.authorization || '')
      .replace('Bearer', '')
      .trim();
    if (!accessToken) {
      throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }
    try {
      const decodeToken = jwt.verify(
        accessToken,
        this.configService.get<string>('JWT_KEY', 'helixkey'),
      ) as any;
      const token = await this.prismaService.tokenOfUser.findUnique({
        where: { token: accessToken },
        include: { user: true },
      });
      if (!token)
        throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
      if (decodeToken.id != token.userId)
        throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
      req.app.set('token', token);
    } catch (error) {
      throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }
    return true;
  }
}
