import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UseJWTAuth } from 'src/modules/decorators/use.jwt.auth';
import { SignKYCDTO, UserSignDTO } from './dtos/user.dto';
import { UserService } from './user.service';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('me')
  @UseJWTAuth()
  @ApiOperation({ summary: `Get detail user` })
  @ApiBearerAuth()
  detail(@Req() req: Request): Promise<any> {
    return this.userService.get(req, req.app.get('token')?.user?.id);
  }

  @Post('/sign-in')
  @ApiOperation({ summary: `Sign-in API` })
  signIn(@Body() body: UserSignDTO): Promise<any> {
    return this.userService.signIn(body);
  }

  @Post('/sign-out')
  @UseJWTAuth()
  @ApiOperation({ summary: `Sign-out API` })
  @ApiBearerAuth()
  signOut(@Req() req: Request): Promise<any> {
    return this.userService.signOut(+req.app.get('token').id);
  }

  @Post('/sign-kyc')
  @UseJWTAuth()
  @ApiOperation({ summary: `Sign KYC API` })
  @ApiBearerAuth()
  signKyc(@Req() req: Request, @Body() body: SignKYCDTO): Promise<any> {
    return this.userService.signKyc(req.app.get('token').user, body);
  }

  @Put('/kyced')
  @UseJWTAuth()
  @ApiOperation({ summary: `update user kyc status API` })
  @ApiBearerAuth()
  updateUserKYCStatus(@Req() req: Request): Promise<any> {
    return this.userService.update(
      { status: { lt: 2 } },
      +req.app.get('token').userId,
      { status: 2 },
    );
  }

  @Put('/:key/requested')
  @UseJWTAuth()
  @ApiOperation({ summary: `update status for key API` })
  @ApiBearerAuth()
  requested(@Req() req: Request, @Param('key') key: string): Promise<any> {
    const statusKey = `${key}Status`;
    const query = {} as any;
    query[statusKey] = { lt: 1 };
    const data = {} as any;
    data[statusKey] = 1;
    return this.userService.update(query, +req.app.get('token').userId, data);
  }
}
