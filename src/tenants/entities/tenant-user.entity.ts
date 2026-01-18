import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { TenantRole } from '../../common/enums/access.enum';
import { User } from '../../users/entities/user.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'tenant_users' })
@Index(['tenantId', 'userId'], { unique: true })
export class TenantUser extends AppBaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.tenantMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: TenantRole })
  role: TenantRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
