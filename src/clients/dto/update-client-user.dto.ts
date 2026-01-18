import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ClientRole } from '../../common/enums/access.enum';

export class UpdateClientUserDto {
  @IsEnum(ClientRole)
  @IsOptional()
  role?: ClientRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
