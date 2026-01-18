import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { ImportRowStatus } from '../enums/import-status.enum';
import { ImportBatch } from './import-batch.entity';

@Entity({ name: 'import_rows' })
@Index(['batchId', 'rowIndex'], { unique: true })
@Index(['batchId', 'status'])
export class ImportRow extends AppBaseEntity {
  @Column({ type: 'uuid' })
  batchId: string;

  @ManyToOne(() => ImportBatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batchId' })
  batch: ImportBatch;

  @Column({ type: 'integer' })
  rowIndex: number;

  @Column({ type: 'jsonb' })
  data: Record<string, string>;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  errors: string[];

  @Column({
    type: 'enum',
    enum: ImportRowStatus,
    enumName: 'import_row_status_enum',
    default: ImportRowStatus.Pending,
  })
  status: ImportRowStatus;
}
