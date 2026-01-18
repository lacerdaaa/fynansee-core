import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TenantRole } from '../../common/enums/access.enum';

export class CreateTenantUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsEnum(TenantRole)
  role: TenantRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
