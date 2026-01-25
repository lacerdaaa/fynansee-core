import { Column, Entity, Index } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';

@Entity({ name: 'password_resets' })
@Index(['tokenHash'], { unique: true })
export class PasswordReset extends AppBaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt?: Date | null;
}
