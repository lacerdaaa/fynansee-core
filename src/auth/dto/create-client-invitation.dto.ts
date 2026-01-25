import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { ClientRole } from '../../common/enums/access.enum';

export class CreateClientInvitationDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsEnum(ClientRole)
  role: ClientRole;
}
