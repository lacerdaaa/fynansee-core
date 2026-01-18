import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { ImportBatchStatus } from '../enums/import-status.enum';

@Entity({ name: 'import_batches' })
@Index(['clientId', 'status'])
export class ImportBatch extends AppBaseEntity {
  @Column({ type: 'uuid' })
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  storageKey?: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  headers: string[];

  @Column({ type: 'integer', default: 0 })
  rowCount: number;

  @Column({ type: 'integer', default: 0 })
  errorCount: number;

  @Column({
    type: 'enum',
    enum: ImportBatchStatus,
    enumName: 'import_batch_status_enum',
  })
  status: ImportBatchStatus;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User | null;
}
