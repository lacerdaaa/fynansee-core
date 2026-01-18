import { Column, Entity, OneToMany } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { Client } from '../../clients/entities/client.entity';
import { TenantUser } from './tenant-user.entity';

@Entity({ name: 'tenants' })
export class Tenant extends AppBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => TenantUser, (tenantUser) => tenantUser.tenant)
  users: TenantUser[];

  @OneToMany(() => Client, (client) => client.tenant)
  clients: Client[];
}
