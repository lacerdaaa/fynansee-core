import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { RecordSource } from '../enums/record-source.enum';
import { ReserveType } from '../enums/reserve-type.enum';

@Entity({ name: 'reserves' })
@Index(['clientId', 'type', 'recordedAt'])
export class Reserve extends AppBaseEntity {
  @Column({ type: 'uuid' })
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({
    type: 'enum',
    enum: ReserveType,
    enumName: 'reserve_type_enum',
  })
  type: ReserveType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  value: string;

  @Column({ type: 'timestamptz' })
  recordedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User | null;

  @Column({
    type: 'enum',
    enum: RecordSource,
    enumName: 'record_source_enum',
    default: RecordSource.Manual,
  })
  source: RecordSource;
}
