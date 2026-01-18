import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { ClientRole } from '../../common/enums/access.enum';
import { User } from '../../users/entities/user.entity';
import { Client } from './client.entity';

@Entity({ name: 'client_users' })
@Index(['clientId', 'userId'], { unique: true })
export class ClientUser extends AppBaseEntity {
  @Column({ type: 'uuid' })
  clientId: string;

  @ManyToOne(() => Client, (client) => client.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.clientMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: ClientRole })
  role: ClientRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
