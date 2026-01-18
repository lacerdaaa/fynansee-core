import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateStockDto {
  @IsNumber()
  @IsPositive()
  value: number;

  @IsDateString()
  @IsOptional()
  recordedAt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
