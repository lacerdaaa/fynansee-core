import { ClientRole } from '../../common/enums/access.enum';

export class CreateClientUserDto {
  name: string;
  email: string;
  role: ClientRole;
  isActive?: boolean;
}
