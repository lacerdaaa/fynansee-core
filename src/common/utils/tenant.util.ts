import { Request } from 'express';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

export const TENANT_HEADER = 'x-tenant-id';

export type TenantRequest = Request & {
  tenantId?: string;
  clientId?: string;
  user?: JwtPayload;
};

export const resolveTenantId = (req: TenantRequest) => {
  const headerValue = req.get?.(TENANT_HEADER) ?? req.headers?.[TENANT_HEADER];
  const headerTenantId =
    typeof headerValue === 'string'
      ? headerValue
      : Array.isArray(headerValue)
        ? headerValue[0]
        : undefined;
  const rawParamTenantId = req.params?.tenantId;
  const paramTenantId =
    typeof rawParamTenantId === 'string'
      ? rawParamTenantId
      : Array.isArray(rawParamTenantId)
        ? rawParamTenantId[0]
        : undefined;
  const userTenantId = req.user?.tenantId;
  const resolvedTenantId = headerTenantId ?? paramTenantId ?? userTenantId;

  return {
    headerTenantId,
    paramTenantId,
    userTenantId,
    resolvedTenantId,
  };
};
