import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { ClosingHealthStatus } from '../enums/closing-health.enum';
import { ClosingPeriodType } from '../enums/closing-period.enum';

@Entity({ name: 'closings' })
@Index(['clientId', 'periodType', 'periodStart', 'periodEnd'], { unique: true })
export class Closing extends AppBaseEntity {
  @Column({ type: 'uuid' })
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({
    type: 'enum',
    enum: ClosingPeriodType,
    enumName: 'closing_period_enum',
  })
  periodType: ClosingPeriodType;

  @Column({ type: 'date' })
  periodStart: string;

  @Column({ type: 'date' })
  periodEnd: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  incomeTotal: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  expenseTotal: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  netTotal: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  startingBalance: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  endingBalance: string;

  @Column({ type: 'date', nullable: true })
  dayOfCashShort?: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  lowIncomeDays: string[];

  @Column({ type: 'integer', default: 0 })
  lowIncomeDaysCount: number;

  @Column({
    type: 'enum',
    enum: ClosingHealthStatus,
    enumName: 'closing_health_enum',
  })
  healthStatus: ClosingHealthStatus;

  @Column({ type: 'timestamptz' })
  generatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User | null;
}
