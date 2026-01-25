import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { TenantRole } from '../../common/enums/access.enum';

export class CreateTenantInvitationDto {
  @IsUUID()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsEnum(TenantRole)
  role: TenantRole;
}
