import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListImportRowsQueryDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(500)
  limit?: number;
}
