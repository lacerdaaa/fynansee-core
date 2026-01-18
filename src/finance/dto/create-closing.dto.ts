import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ClosingPeriodType } from '../enums/closing-period.enum';

export class CreateClosingDto {
  @IsEnum(ClosingPeriodType)
  periodType: ClosingPeriodType;

  @IsDateString()
  @IsOptional()
  referenceDate?: string;
}
