import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_TYPES_KEY } from '../decorators/user-types.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserType } from '../../common/enums/access.enum';
import { resolveTenantId, TenantRequest } from '../../common/utils/tenant.util';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<TenantRequest>();
    const user = req.user as JwtPayload | undefined;

    if (!user) {
      throw new UnauthorizedException('Missing user credentials');
    }

    const requiredTypes = this.reflector.getAllAndOverride<UserType[]>(
      USER_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredTypes && !requiredTypes.includes(user.type)) {
      throw new ForbiddenException('User type not allowed');
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && (!user.role || !requiredRoles.includes(user.role))) {
      throw new ForbiddenException('User role not allowed');
    }

    const { clientId } = req.params ?? {};
    const {
      headerTenantId,
      paramTenantId,
      userTenantId,
      resolvedTenantId,
    } = resolveTenantId(req);

    if (headerTenantId && paramTenantId && headerTenantId !== paramTenantId) {
      throw new ForbiddenException('Tenant scope mismatch');
    }

    if (headerTenantId && userTenantId && headerTenantId !== userTenantId) {
      throw new ForbiddenException('Tenant scope mismatch');
    }

    if (paramTenantId && userTenantId && paramTenantId !== userTenantId) {
      throw new ForbiddenException('Tenant scope mismatch');
    }

    if (resolvedTenantId) {
      req.tenantId = resolvedTenantId;
      if (!user.tenantId && user.type === UserType.Controller) {
        user.tenantId = resolvedTenantId;
      }
    }

    if (clientId && user.clientId && clientId !== user.clientId) {
      throw new ForbiddenException('Client scope mismatch');
    }

    return true;
  }
}
