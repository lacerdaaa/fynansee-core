import { ClientRole } from '../../common/enums/access.enum';

export class UpdateClientUserDto {
  role?: ClientRole;
  isActive?: boolean;
}
