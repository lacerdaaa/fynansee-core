import { SetMetadata } from '@nestjs/common';
import { UserType } from '../../common/enums/access.enum';

export const USER_TYPES_KEY = 'userTypes';
export const UserTypes = (...types: UserType[]) =>
  SetMetadata(USER_TYPES_KEY, types);
