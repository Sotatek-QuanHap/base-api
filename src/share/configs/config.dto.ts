import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ConfigCreateDTO {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  stringValue: string;

  @IsOptional()
  @IsNumber()
  numberValue: number;

  @IsOptional()
  @IsBoolean()
  isMulti: boolean;

  @IsOptional()
  @IsNumber()
  numberRecords: number;
}

export class ConfigUpdateDTO {
  @IsOptional()
  @IsString()
  valueString: string;

  @IsOptional()
  @IsNumber()
  valueNumber: number;
}
