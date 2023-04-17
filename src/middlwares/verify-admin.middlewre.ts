import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';

@Injectable()
export class VerifyAdminMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const query = req.headers;
    // console.log('header of admin: ', query);
    next();
  }
}
