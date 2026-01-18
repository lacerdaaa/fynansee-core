import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CashflowQueryDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(24)
  months?: number;
}
