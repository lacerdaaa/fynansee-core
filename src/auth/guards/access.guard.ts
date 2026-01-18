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

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
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

    const { tenantId, clientId } = req.params ?? {};

    if (tenantId && user.tenantId && tenantId !== user.tenantId) {
      throw new ForbiddenException('Tenant scope mismatch');
    }

    if (clientId && user.clientId && clientId !== user.clientId) {
      throw new ForbiddenException('Client scope mismatch');
    }

    return true;
  }
}
