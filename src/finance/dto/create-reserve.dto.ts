import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ReserveType } from '../enums/reserve-type.enum';

export class CreateReserveDto {
  @IsEnum(ReserveType)
  type: ReserveType;

  @IsNumber()
  @IsPositive()
  value: number;

  @IsDateString()
  @IsOptional()
  recordedAt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  label?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
