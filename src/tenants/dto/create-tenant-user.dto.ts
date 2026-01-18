import { TenantRole } from '../../common/enums/access.enum';

export class CreateTenantUserDto {
  name: string;
  email: string;
  role: TenantRole;
  isActive?: boolean;
}
