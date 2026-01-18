import 'dotenv/config';
import { connect } from 'amqplib';
import { BlobServiceClient } from '@azure/storage-blob';
import { parse } from 'csv-parse';
import { AppDataSource } from '../data-source';
import { ImportBatch } from '../finance/entities/import-batch.entity';
import { ImportRow } from '../finance/entities/import-row.entity';
import { ImportBatchStatus, ImportRowStatus } from '../finance/enums/import-status.enum';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? '';
const IMPORT_QUEUE_NAME = process.env.IMPORT_QUEUE_NAME ?? 'imports.csv';
const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING ?? '';
const AZURE_STORAGE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER ?? '';
const IMPORT_BATCH_SIZE = Number(process.env.IMPORT_BATCH_SIZE ?? 1000);
const IMPORT_PREFETCH = Number(process.env.IMPORT_PREFETCH ?? 1);

if (!RABBITMQ_URL) {
  throw new Error('RABBITMQ_URL not configured');
}

if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error('AZURE_STORAGE_CONNECTION_STRING not configured');
}

if (!AZURE_STORAGE_CONTAINER) {
  throw new Error('AZURE_STORAGE_CONTAINER not configured');
}

async function processBatch(message: {
  batchId: string;
  clientId: string;
  storageKey?: string;
}) {
  const batchRepo = AppDataSource.getRepository(ImportBatch);
  const rowRepo = AppDataSource.getRepository(ImportRow);

  const batch = await batchRepo.findOne({
    where: { id: message.batchId, clientId: message.clientId },
  });

  if (!batch) {
    return;
  }

  const storageKey = message.storageKey ?? batch.storageKey;

  if (!storageKey) {
    await batchRepo.update(batch.id, {
      status: ImportBatchStatus.Failed,
      processedAt: new Date(),
    });
    return;
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING,
  );
  const containerClient = blobServiceClient.getContainerClient(
    AZURE_STORAGE_CONTAINER,
  );
  const blobClient = containerClient.getBlobClient(storageKey);
  const downloadResponse = await blobClient.download();
  const stream = downloadResponse.readableStreamBody;

  if (!stream) {
    throw new Error('Unable to read CSV stream');
  }

  const parser = parse({
    columns: true,
    bom: true,
    trim: true,
    skip_empty_lines: true,
  });

  const headers: string[] = [];
  let rowIndex = 0;
  let errorCount = 0;
  const rowsBuffer: Array<Partial<ImportRow>> = [];

  const flush = async () => {
    if (rowsBuffer.length === 0) {
      return;
    }

    const chunk = rowsBuffer.splice(0, rowsBuffer.length);
    await rowRepo.insert(chunk);
  };

  try {
    const streamParser = stream.pipe(parser);

    for await (const record of streamParser) {
      rowIndex += 1;
      if (headers.length === 0) {
        headers.push(...Object.keys(record));
      }

      rowsBuffer.push({
        batchId: batch.id,
        rowIndex,
        data: record as Record<string, string>,
        errors: [],
        status: ImportRowStatus.Pending,
      });

      if (rowsBuffer.length >= IMPORT_BATCH_SIZE) {
        await flush();
      }
    }

    await flush();

    await batchRepo.update(batch.id, {
      headers,
      rowCount: rowIndex,
      errorCount,
      status: ImportBatchStatus.Processed,
      processedAt: new Date(),
    });
  } catch (error) {
    errorCount += 1;
    await batchRepo.update(batch.id, {
      errorCount,
      status: ImportBatchStatus.Failed,
      processedAt: new Date(),
    });

    throw error;
  }
}

async function start() {
  await AppDataSource.initialize();

  const connection = await connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(IMPORT_QUEUE_NAME, { durable: true });
  channel.prefetch(IMPORT_PREFETCH);

  channel.consume(IMPORT_QUEUE_NAME, async (msg) => {
    if (!msg) {
      return;
    }

    try {
      const payload = JSON.parse(msg.content.toString()) as {
        batchId: string;
        clientId: string;
        storageKey?: string;
      };

      await processBatch(payload);
      channel.ack(msg);
    } catch (error) {
      console.error('Import worker failed');
      console.error(error);
      channel.ack(msg);
    }
  });

  const shutdown = async () => {
    await channel.close();
    await connection.close();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Import worker failed to start');
  console.error(error);
  process.exit(1);
});
