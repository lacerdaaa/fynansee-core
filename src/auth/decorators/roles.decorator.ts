import { SetMetadata } from '@nestjs/common';
import { JwtRole } from '../interfaces/jwt-payload.interface';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: JwtRole[]) => SetMetadata(ROLES_KEY, roles);
