import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { TenantRole } from '../../common/enums/access.enum';

export class UpdateTenantUserDto {
  @IsEnum(TenantRole)
  @IsOptional()
  role?: TenantRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
