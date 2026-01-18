import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ClosingPeriodType } from '../enums/closing-period.enum';

export class ListClosingsQueryDto {
  @IsEnum(ClosingPeriodType)
  @IsOptional()
  periodType?: ClosingPeriodType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
