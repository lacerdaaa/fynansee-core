import { IsDateString, IsOptional } from 'class-validator';

export class DateRangeQueryDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
