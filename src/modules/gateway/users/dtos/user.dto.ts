import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUserDTO {}

export class UpdateUserDTO {}

export class UserSignDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    example: '0x0000000000000000000000000000000000000000',
  })
  address: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    example: '0x0000000000000000000000000000000000000000',
  })
  sign: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    example: 1676362449722,
  })
  timestamp: number;
}

export class SignKYCDTO {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    example: 5,
  })
  chainId: number;
}
