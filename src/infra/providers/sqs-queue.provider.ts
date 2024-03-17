import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { QueueProvider } from '@app/domain/work/contracts/queue.provider';
import * as Sentry from '@sentry/node';

import {
  CreateQueueCommand,
  ListQueuesCommand,
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { Consumer } from 'sqs-consumer';

@Injectable()
export class SqsQueueProvider implements QueueProvider, OnModuleDestroy {
  private logger = new Logger(SqsQueueProvider.name);

  private consumers = new Map<string, Consumer>();

  private readonly sqs: SQSClient;

  private readonly sentry = Sentry;

  constructor(private readonly config: ConfigService) {
    this.sqs = new SQSClient({
      region: this.config.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get('AWS_SECRET_KEY_ACCESS'),
      },
    });

    this.sentry.init({
      dsn: this.config.get('SENTRY_ENDPOINT'),
      integrations: [],
    });
  }
  async publish<Payload = unknown>(
    name: string,
    payload: Payload,
  ): Promise<void> {
    const endpoint = await this.createQueueIfNotExists(name);

    await this.sqs.send(
      new SendMessageCommand({
        QueueUrl: endpoint,
        MessageBody: JSON.stringify(payload),
      }),
    );
  }

  async registerWorker<Payload = any>(
    name: string,
    callback: (payload: Payload) => Promise<void>,
  ) {
    const endpoint = await this.createQueueIfNotExists(name);

    let consumer: Consumer = this.consumers.get(endpoint);

    if (!consumer) {
      consumer = Consumer.create({
        queueUrl: endpoint,
        sqs: this.sqs,
        handleMessage: (message) => callback(JSON.parse(message.Body)),
      });

      consumer.setMaxListeners(15);

      consumer.on('processing_error', (err) => {
        this.logger.error(`ocorrreu um erro  ${err.message}`);

        this.sentry.captureException(err);
      });

      consumer.on('message_received', (message) =>
        this.logger.debug(`Message received: ${JSON.stringify(message.Body)}`),
      );

      consumer.on('message_processed', () => {
        this.logger.debug('Message processed');
      });

      this.consumers.set(endpoint, consumer);
    }

    if (!consumer.isRunning) {
      consumer.start();
    }
  }

  public async createQueueIfNotExists(name: string): Promise<string> {
    let queueUrl: string;

    const currentQueues = await this.sqs.send(
      new ListQueuesCommand({ QueueNamePrefix: name }),
    );

    if (!currentQueues?.QueueUrls?.length) {
      const results = await this.sqs.send(
        new CreateQueueCommand({ QueueName: name }),
      );

      queueUrl = results.QueueUrl;
    } else {
      queueUrl = currentQueues.QueueUrls[0];
    }

    return queueUrl;
  }

  onModuleDestroy() {
    this.consumers.forEach((consumer) => {
      if (consumer.isRunning) {
        consumer.stop({
          abort: true,
        });
      }
    });
  }
}
