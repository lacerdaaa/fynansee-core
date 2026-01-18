import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  document?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
