import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ImportBatchStatus } from '../enums/import-status.enum';

export class ListImportsQueryDto {
  @IsEnum(ImportBatchStatus)
  @IsOptional()
  status?: ImportBatchStatus;

  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}
