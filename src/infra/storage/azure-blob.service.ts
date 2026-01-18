import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobServiceClient,
  BlockBlobClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

@Injectable()
export class AzureBlobService {
  private readonly connectionString: string;
  private readonly containerName: string;

  constructor(private readonly configService: ConfigService) {
    this.connectionString =
      this.configService.get<string>('AZURE_STORAGE_CONNECTION_STRING') ?? '';
    this.containerName =
      this.configService.get<string>('AZURE_STORAGE_CONTAINER') ?? '';
  }

  private getBlobClient(blobName: string): BlockBlobClient {
    if (!this.connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING not configured');
    }

    if (!this.containerName) {
      throw new Error('AZURE_STORAGE_CONTAINER not configured');
    }

    const serviceClient = BlobServiceClient.fromConnectionString(
      this.connectionString,
    );
    const containerClient = serviceClient.getContainerClient(
      this.containerName,
    );

    return containerClient.getBlockBlobClient(blobName);
  }

  async uploadBuffer(
    blobName: string,
    buffer: Buffer,
    contentType = 'text/csv',
  ): Promise<{ url: string; blobName: string }>
  {
    const blobClient = this.getBlobClient(blobName);

    await blobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    return { url: blobClient.url, blobName };
  }
}
