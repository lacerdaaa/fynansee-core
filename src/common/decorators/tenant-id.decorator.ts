import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { resolveTenantId, TenantRequest } from '../utils/tenant.util';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    return resolveTenantId(req).resolvedTenantId;
  },
);
