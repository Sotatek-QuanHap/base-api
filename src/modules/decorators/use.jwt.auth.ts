import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtVerifyRequestGuard } from './jwt.verify.request.guard';

export function UseJWTAuth() {
  return applyDecorators(UseGuards(JwtVerifyRequestGuard));
}
