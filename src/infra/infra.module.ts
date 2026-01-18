import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AzureBlobService } from './storage/azure-blob.service';
import { RabbitMqService } from './queue/rabbitmq.service';

@Module({
  imports: [ConfigModule],
  providers: [AzureBlobService, RabbitMqService],
  exports: [AzureBlobService, RabbitMqService],
})
export class InfraModule {}
