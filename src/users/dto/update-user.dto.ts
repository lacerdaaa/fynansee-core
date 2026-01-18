import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
