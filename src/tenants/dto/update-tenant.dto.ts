import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
