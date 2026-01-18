import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect } from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private connection?: ChannelModel;
  private channel?: Channel;
  private readonly url: string;
  private readonly queueName: string;

  constructor(private readonly configService: ConfigService) {
    this.url = this.configService.get<string>('RABBITMQ_URL') ?? '';
    this.queueName =
      this.configService.get<string>('IMPORT_QUEUE_NAME') ?? 'imports.csv';
  }

  async onModuleInit(): Promise<void> {
    if (!this.url) {
      throw new Error('RABBITMQ_URL not configured');
    }

    const connection = await connect(this.url);
    this.connection = connection;
    this.channel = await connection.createChannel();
    await this.channel.assertQueue(this.queueName, { durable: true });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  async publishImportJob(payload: Record<string, unknown>): Promise<void> {
    if (!this.channel) {
      await this.onModuleInit();
    }

    const body = Buffer.from(JSON.stringify(payload));
    this.channel?.sendToQueue(this.queueName, body, { persistent: true });
  }
}
