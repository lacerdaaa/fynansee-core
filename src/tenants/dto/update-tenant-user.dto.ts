import { TenantRole } from '../../common/enums/access.enum';

export class UpdateTenantUserDto {
  role?: TenantRole;
  isActive?: boolean;
}
