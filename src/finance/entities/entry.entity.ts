import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { MovementType } from '../enums/movement-type.enum';
import { RecordSource } from '../enums/record-source.enum';

@Entity({ name: 'entries' })
@Index(['clientId', 'occurredOn'])
export class Entry extends AppBaseEntity {
  @Column({ type: 'uuid' })
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column({ type: 'date' })
  occurredOn: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

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
