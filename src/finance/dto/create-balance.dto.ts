import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class CreateBalanceDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDateString()
  @IsOptional()
  recordedAt?: string;
}
