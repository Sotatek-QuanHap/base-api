import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum order_by {
  asc = 'asc',
  desc = 'desc',
}

export class PageOptionsSwagger {
  @ApiPropertyOptional({ enum: order_by, default: order_by.asc })
  @IsEnum(order_by)
  @IsOptional()
  readonly order_by?: order_by = order_by.asc;

  @ApiPropertyOptional()
  @Type(() => String)
  @IsOptional()
  readonly sort_by?: string = 'name';

  @ApiPropertyOptional({
    minimum: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  readonly page?: number = 0;

  @ApiPropertyOptional({
    minimum: 0,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  readonly size?: number = 10;
}
