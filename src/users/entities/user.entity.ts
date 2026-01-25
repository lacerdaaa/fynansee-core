import { Column, Entity, Index, OneToMany } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { UserType } from '../../common/enums/access.enum';
import { ClientUser } from '../../clients/entities/client-user.entity';
import { TenantUser } from '../../tenants/entities/tenant-user.entity';

@Entity({ name: 'users' })
@Index(['email'], { unique: true })
@Index(['oauthProvider', 'oauthSubject'], { unique: true })
export class User extends AppBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50, default: 'google' })
  oauthProvider: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  oauthSubject?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash?: string | null;

  @Column({ type: 'enum', enum: UserType })
  type: UserType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date | null;

  @OneToMany(() => TenantUser, (tenantUser) => tenantUser.user)
  tenantMemberships: TenantUser[];

  @OneToMany(() => ClientUser, (clientUser) => clientUser.user)
  clientMemberships: ClientUser[];
}
