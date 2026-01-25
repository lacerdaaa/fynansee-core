import { Column, Entity, Index } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { UserType } from '../../common/enums/access.enum';

@Entity({ name: 'auth_invitations' })
@Index(['tokenHash'], { unique: true })
export class AuthInvitation extends AppBaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  clientId?: string | null;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: UserType })
  userType: UserType;

  @Column({ type: 'varchar', length: 50 })
  role: string;

  @Column({ type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt?: Date | null;

  @Column({ type: 'uuid' })
  createdByUserId: string;
}
