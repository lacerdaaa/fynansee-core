import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { ClientUser } from './client-user.entity';

@Entity({ name: 'clients' })
export class Client extends AppBaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.clients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  document?: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ClientUser, (clientUser) => clientUser.client)
  users: ClientUser[];
}
