import { ClientRole, TenantRole, UserType } from '../../common/enums/access.enum';

export type JwtRole = TenantRole | ClientRole;

export interface JwtPayload {
  sub: string;
  type: UserType;
  tenantId?: string;
  clientId?: string;
  role?: JwtRole;
}
